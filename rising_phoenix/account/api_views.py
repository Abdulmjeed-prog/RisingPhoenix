from decimal import Decimal
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User
from django.utils.http import urlsafe_base64_decode

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from twilio.rest import Client as TwilioClient



from .serializers import (
    RegisterSerializer,
    RegisterArtisanSerializer,
    UserSerializer,
    ProfileSerializer,
    ArtisanProfileSerializer,
    ActiveContractSerializer,
    CompletedContractSerializer,
    RevenueSerializer,
    PublicProfileSerializer
)
from .models import Profile, ArtisanProfile, ArtisanRevenue


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': _tokens_for_user(user),
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_artisan(request):
    serializer = RegisterArtisanSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': _tokens_for_user(user),
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the currently logged-in user + profile."""
    return Response(UserSerializer(request.user).data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request, user_name):
    """Update user + profile. `user_name` must match the logged-in user."""
    user = request.user

    if user_name != user.username:
        return Response(
            {'detail': 'You are not allowed to edit another user.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    is_artisan = user.groups.filter(name='artisan').exists()
    data = request.data

    with transaction.atomic():
        # ── User fields ──
        for field in ['first_name', 'last_name', 'email']:
            if field in data:
                setattr(user, field, data[field])

        if 'username' in data and data['username'] != user.username:
            new_username = data['username']
            if User.objects.filter(username__iexact=new_username).exclude(pk=user.pk).exists():
                return Response(
                    {'username': ['This username is already in use.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.username = new_username

        user.save()

        # ── Profile fields ──
        if is_artisan:
            profile = getattr(user, 'artisanprofile', None)
            serializer_class = ArtisanProfileSerializer
        else:
            profile = getattr(user, 'profile', None)
            serializer_class = ProfileSerializer

        if profile is None:
            return Response({'detail': 'Profile not found.'}, status=404)

        serializer = serializer_class(profile, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_changed = 'phone' in serializer.validated_data
        serializer.save()

        if phone_changed:
            profile.is_phone_verified = False
            profile.save(update_fields=['is_phone_verified'])

    return Response(UserSerializer(user).data)

    # PATCH — update user + profile
    data = request.data
    with transaction.atomic():
        # User fields
        for field in ['first_name', 'last_name', 'email']:
            if field in data:
                setattr(user, field, data[field])
        user.save()

        # Profile fields
        if is_artisan:
            profile = getattr(user, 'artisanprofile', None)
            serializer_class = ArtisanProfileSerializer
        else:
            profile = getattr(user, 'profile', None)
            serializer_class = ProfileSerializer

        if profile is None:
            return Response({'detail': 'Profile not found.'}, status=404)

        serializer = serializer_class(profile, data=data, partial=True)
        if serializer.is_valid():
            # Reset phone verification if phone changed
            if 'phone' in serializer.validated_data:
                serializer.validated_data['is_phone_verified'] = False
            serializer.save()
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(UserSerializer(user).data)


def _is_artisan(user):
    return user.groups.filter(name='artisan').exists()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def artisan_dashboard_api(request):
    artisan = request.user

    if not _is_artisan(artisan):
        return Response(
            {'detail': 'Only artisans can view this page.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    now = timezone.now()

    revenues = (
        ArtisanRevenue.objects
        .filter(artisan=artisan)
        .select_related('contract', 'escrow_payment')
        .order_by('-created_at')
    )

    total_earned = revenues.filter(
        status__in=[ArtisanRevenue.Status.EARNED, ArtisanRevenue.Status.PAID]
    ).aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')

    total_paid = revenues.filter(
        status=ArtisanRevenue.Status.PAID
    ).aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')

    current_balance = revenues.filter(
        status=ArtisanRevenue.Status.EARNED
    ).aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')

    this_month_qs = revenues.filter(
        created_at__year=now.year,
        created_at__month=now.month,
        status__in=[ArtisanRevenue.Status.EARNED, ArtisanRevenue.Status.PAID],
    )

    this_month_total = this_month_qs.aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')
    this_month_jobs = this_month_qs.aggregate(count=Count('id'))['count'] or 0

    recent_revenues = revenues[:10]

    monthly_revenues = (
        revenues.filter(status__in=[ArtisanRevenue.Status.EARNED, ArtisanRevenue.Status.PAID])
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(total=Sum('net_amount'), jobs=Count('id'))
        .order_by('month')
    )

    chart_labels = [
        item['month'].strftime('%b %Y') for item in monthly_revenues if item['month']
    ]
    chart_totals = [float(item['total'] or 0) for item in monthly_revenues]

    # Contracts
    from progress.models import Contract

    active_requests = (
        Contract.objects.filter(
            proposal__artisan=artisan,
            status=Contract.Status.IN_PROGRESS,
        )
        .select_related('proposal__request', 'proposal__artisan')
        .order_by('-created_at')
    )

    completed_requests = (
        Contract.objects.filter(
            proposal__artisan=artisan,
            status=Contract.Status.COMPLETED,
        )
        .select_related('proposal__request', 'proposal__artisan')
        .order_by('-created_at')[:5]
    )

    # Stripe — do NOT call the Stripe API inside the dashboard for performance.
    # Return the stored state; a separate endpoint handles live Stripe status.
    stripe_connected = False
    stripe_payouts_enabled = False
    stripe_details_submitted = False
    stripe_status_message = ''
    stripe_requirements_due = 0

    stripe_account_id = getattr(
        getattr(artisan, 'artisanprofile', None), 'stripe_connected_account_id', None
    )
    if stripe_account_id:
        stripe_connected = True
        stripe_status_message = 'Stripe account connected.'

    return Response({
        'user': {
            'username': artisan.username,
            'full_name': artisan.get_full_name() or artisan.username,
        },
        'stats': {
            'total_earned': str(total_earned),
            'total_paid': str(total_paid),
            'current_balance': str(current_balance),
            'this_month_total': str(this_month_total),
            'this_month_jobs': this_month_jobs,
        },
        'chart': {
            'labels': chart_labels,
            'totals': chart_totals,
        },
        'stripe': {
            'connected': stripe_connected,
            'payouts_enabled': stripe_payouts_enabled,
            'details_submitted': stripe_details_submitted,
            'status_message': stripe_status_message,
            'requirements_due': stripe_requirements_due,
        },
        'active_requests': ActiveContractSerializer(active_requests, many=True).data,
        'completed_requests': CompletedContractSerializer(completed_requests, many=True).data,
        'recent_revenues': RevenueSerializer(recent_revenues, many=True).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def profile_api(request, username):
    user_obj = get_object_or_404(User, username=username)

    serializer = PublicProfileSerializer(
        user_obj, context={'request': request}
    )
    return Response(serializer.data)

def _get_profile_for(user):
    """Return the correct profile model for a user (artisan or regular)."""
    if user.groups.filter(name='artisan').exists():
        return getattr(user, 'artisanprofile', None)
    return getattr(user, 'profile', None)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_phone_verification(request, user_name):
    """Send an SMS verification code via Twilio."""
    if user_name != request.user.username:
        return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    profile = _get_profile_for(request.user)
    if not profile:
        return Response({'detail': 'Profile not found.'}, status=404)

    if not profile.phone:
        return Response(
            {'detail': 'Please add your phone number first.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if profile.is_phone_verified:
        return Response(
            {'detail': 'Your phone is already verified.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.verify.v2.services(
            settings.TWILIO_VERIFY_SERVICE_SID
        ).verifications.create(
            to=str(profile.phone),
            channel='sms',
        )
        return Response({'message': 'Verification code sent.'})
    except Exception as e:
        return Response(
            {'detail': f'Failed to send verification code: {e}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_phone(request, user_name):
    """Check a Twilio verification code."""
    if user_name != request.user.username:
        return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    profile = _get_profile_for(request.user)
    if not profile:
        return Response({'detail': 'Profile not found.'}, status=404)

    if not profile.phone:
        return Response(
            {'detail': 'Please add your phone number first.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    code = (request.data.get('code') or '').strip()
    if not code:
        return Response(
            {'code': ['Please enter the verification code.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        check = client.verify.v2.services(
            settings.TWILIO_VERIFY_SERVICE_SID
        ).verification_checks.create(
            to=str(profile.phone),
            code=code,
        )

        if check.status == 'approved':
            profile.is_phone_verified = True
            profile.save(update_fields=['is_phone_verified'])
            return Response({'message': 'Phone verified successfully.', 'verified': True})

        return Response(
            {'code': ['Invalid verification code.']},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {'detail': f'Verification failed: {e}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """Send a password reset email."""
    email = (request.data.get('email') or '').strip()
    if not email:
        return Response({'email': ['Email is required.']}, status=status.HTTP_400_BAD_REQUEST)

    form = PasswordResetForm({'email': email})
    if form.is_valid():
        form.save(
            request=request,
            use_https=request.is_secure(),
            from_email=None,
            email_template_name='account/password_reset_email.html',
            subject_template_name='account/password_reset_subject.txt',
            html_email_template_name='account/password_reset_email_html.html',
            extra_email_context={
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
            },
        )

    # Always return success — never reveal whether an email exists
    return Response({
        'message': 'If that email exists, a reset link has been sent.'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def password_reset_verify(request, uidb64, token):
    """Check whether a reset link is still valid (before showing the form)."""
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    valid = user is not None and default_token_generator.check_token(user, token)
    return Response({'valid': valid})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request, uidb64, token):
    """Set a new password using uid + token."""
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response(
            {'detail': 'This reset link is invalid or has expired.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    form = SetPasswordForm(user, request.data)
    if form.is_valid():
        form.save()
        return Response({'message': 'Password updated successfully.'})
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
