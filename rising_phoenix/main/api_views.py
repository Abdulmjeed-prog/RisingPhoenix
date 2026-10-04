from django.db.models import Avg
from django.db.models import Count
from django.core.paginator import Paginator
from django.contrib.auth.models import User
from django.db.models import Avg, Q

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from request.models import Request
from workshop.models import WorkshopProfile
from workshop.models import Category   # ← adjust if Category lives elsewhere
from message.models import Conversation, Message
from proposal.models import Proposal
from notification.models import Notification
from .serializers import CategorySerializer, HomeRequestSerializer, HomeWorkshopSerializer, BrowseArtisanSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def home_api(request):
    categories = Category.objects.exclude(name='Jewelry').order_by('name')[:5]

    is_artisan_user = (
        request.user.is_authenticated
        and hasattr(request.user, 'artisanprofile')
    )

    latest_requests = None
    top_rated_workshops = None

    if is_artisan_user:
        latest_requests = (
            Request.objects
            .filter(status__in=[Request.Status.OPEN, Request.Status.IN_REVIEW])
            .select_related('requester', 'category')
            .prefetch_related('images')
            .order_by('-created_at')[:8]
        )
    else:
        top_rated_workshops = (
            WorkshopProfile.objects
            .filter(is_published=True)
            .select_related('artisan__user')
            .prefetch_related('categories')
            .annotate(avg_rating=Avg('artisan__user__reviews_received__rating'))
            .order_by('-avg_rating', '-created_at')[:8]
        )

    return Response({
        'home_feed_type': 'requests' if is_artisan_user else 'top_artisans',
        'categories': CategorySerializer(categories, many=True).data,
        'latest_requests': HomeRequestSerializer(latest_requests, many=True).data
            if latest_requests is not None else [],
        'top_rated_workshops': HomeWorkshopSerializer(top_rated_workshops, many=True).data
            if top_rated_workshops is not None else [],
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_api(request):
    user = request.user
    is_artisan = hasattr(user, 'artisanprofile')
    is_staff = user.is_staff
    is_requester = not is_artisan and not is_staff

    data = {
        'is_artisan': is_artisan,
        'is_staff': is_staff,
        'is_requester': is_requester,
        'username': user.username,
        'first_name': user.first_name or user.username,
        'date_joined': user.date_joined.isoformat(),
    }

    if is_requester:
        status_filter = request.query_params.get('request_status', 'all')

        my_requests_qs = Request.objects.filter(requester=user)
        filtered_requests_qs = my_requests_qs

        valid_statuses = {
            Request.Status.OPEN,
            Request.Status.IN_REVIEW,
            Request.Status.CLOSED,
            Request.Status.TIME_ENDED,
        }
        if status_filter in valid_statuses:
            filtered_requests_qs = filtered_requests_qs.filter(status=status_filter)

        my_requests_recent = (
            filtered_requests_qs
            .select_related('category')
            .annotate(proposal_count=Count('proposals'))
            .order_by('-created_at')[:5]
        )

        proposals_qs = Proposal.objects.filter(request__requester=user)

        unread_notifications_count = Notification.objects.filter(
            recipient=user, is_read=False,
        ).count()

        notifications_recent = (
            Notification.objects.filter(recipient=user)
            .order_by('-created_at')[:5]
        )

        requester_conversations = Conversation.objects.filter(requester=user)
        unread_messages_count = Message.objects.filter(
            conversation__in=requester_conversations,
            is_read=False,
        ).exclude(sender=user).count()

        data.update({
            'request_status': status_filter,
            'my_requests_total': my_requests_qs.count(),
            'requests_open_total': my_requests_qs.filter(status=Request.Status.OPEN).count(),
            'requests_in_review_total': my_requests_qs.filter(status=Request.Status.IN_REVIEW).count(),
            'requests_closed_total': my_requests_qs.filter(status=Request.Status.CLOSED).count(),
            'proposals_total': proposals_qs.count(),
            'proposals_pending_total': proposals_qs.filter(status=Proposal.Status.PENDING).count(),
            'unread_notifications_count': unread_notifications_count,
            'unread_messages_count': unread_messages_count,
            'active_conversations_count': requester_conversations.filter(is_active=True).count(),
            'my_requests_recent': [
                {
                    'id': r.id,
                    'title': r.title,
                    'status': r.status,
                    'status_display': r.get_status_display(),
                    'created_at': r.created_at.isoformat(),
                    'proposal_count': r.proposal_count,
                }
                for r in my_requests_recent
            ],
            'notifications_recent': [
                {
                    'id': n.id,
                    'title': n.title,
                    'link': getattr(n, 'link', '') or '',
                    'created_at': n.created_at.isoformat(),
                }
                for n in notifications_recent
            ],
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def browse_api(request):
    artisans = User.objects.filter(
        groups__name='artisan',
        artisanprofile__workshop_profile__is_published=True,
    ).select_related(
        'artisanprofile',
        'artisanprofile__workshop_profile',
    ).prefetch_related(
        'artisanprofile__workshop_profile__categories',
    ).annotate(
        avg_rating=Avg('reviews_received__rating'),
    ).distinct()

    params = request.query_params

    category_id = params.get('category')
    city = params.get('city')
    q = params.get('q')
    sort = params.get('sort')
    rating_min = params.get('rating_min')
    rating_max = params.get('rating_max')
    use_rating = params.get('use_rating') == '1'
    verified_only = params.get('verified') == '1'

    if category_id:
        artisans = artisans.filter(
            artisanprofile__workshop_profile__categories__id=category_id
        )

    if city:
        artisans = artisans.filter(
            artisanprofile__workshop_profile__location__icontains=city
        )

    if verified_only:
        artisans = artisans.filter(artisanprofile__is_verified=True)

    if q:
        artisans = artisans.filter(
            Q(username__icontains=q)
            | Q(first_name__icontains=q)
            | Q(last_name__icontains=q)
            | Q(artisanprofile__bio__icontains=q)
            | Q(artisanprofile__workshop_profile__workshop_name__icontains=q)
            | Q(artisanprofile__workshop_profile__tagline__icontains=q)
            | Q(artisanprofile__workshop_profile__description__icontains=q)
            | Q(artisanprofile__workshop_profile__services__icontains=q)
            | Q(artisanprofile__workshop_profile__location__icontains=q)
            | Q(artisanprofile__workshop_profile__categories__name__icontains=q)
        ).distinct()

    try:
        min_value = float(rating_min) if rating_min else 1.0
    except (ValueError, TypeError):
        min_value = 1.0

    try:
        max_value = float(rating_max) if rating_max else 5.0
    except (ValueError, TypeError):
        max_value = 5.0

    if min_value > max_value:
        min_value, max_value = max_value, min_value

    if use_rating:
        artisans = artisans.filter(
            avg_rating__gte=min_value, avg_rating__lte=max_value
        )

    sort_map = {
        'newest': '-artisanprofile__workshop_profile__created_at',
        'oldest': 'artisanprofile__workshop_profile__created_at',
        'name_az': 'first_name',
        'name_za': '-first_name',
        'workshop_az': 'artisanprofile__workshop_profile__workshop_name',
        'workshop_za': '-artisanprofile__workshop_profile__workshop_name',
        'city_az': 'artisanprofile__workshop_profile__location',
        'city_za': '-artisanprofile__workshop_profile__location',
        'rating_high': '-avg_rating',
        'rating_low': 'avg_rating',
    }

    if sort in sort_map:
        artisans = artisans.order_by(
            sort_map[sort], '-artisanprofile__workshop_profile__created_at'
        ).distinct()
    else:
        sort = 'newest'
        artisans = artisans.order_by(
            '-artisanprofile__workshop_profile__created_at'
        ).distinct()

    paginator = Paginator(artisans, 6)
    page_number = params.get('page')
    page_obj = paginator.get_page(page_number)

    categories = Category.objects.all().order_by('name')
    cities = (
        User.objects.filter(
            groups__name='artisan',
            artisanprofile__workshop_profile__is_published=True,
            artisanprofile__workshop_profile__location__isnull=False,
        )
        .exclude(artisanprofile__workshop_profile__location='')
        .values_list('artisanprofile__workshop_profile__location', flat=True)
        .distinct()
        .order_by('artisanprofile__workshop_profile__location')
    )

    return Response({
        'artisans': BrowseArtisanSerializer(page_obj.object_list, many=True).data,
        'categories': CategorySerializer(categories, many=True).data,
        'cities': list(cities),
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
            'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
        },
    })
