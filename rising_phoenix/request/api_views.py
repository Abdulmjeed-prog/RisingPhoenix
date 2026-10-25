from django.core.cache import cache
from django.core.paginator import Paginator
from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from workshop.models import Category
from proposal.models import Proposal

from .models import Request
from .serializers import RequestListSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from invitation.models import Invitation
from workshop.models import WorkshopProfile

from .models import RequestImage
from .serializers import (
    RequestDetailSerializer,
    SuggestedArtisanSerializer,
    RequestCreateUpdateSerializer,
)

def _refresh_time_based_statuses():
    """Same logic as the web view — auto-expire deadlines and revert in_review → open."""
    cache_key = 'request_statuses_refreshed'
    if cache.get(cache_key):
        return
    today = timezone.localdate()
    Request.objects.filter(
        status__in=[Request.Status.OPEN, Request.Status.IN_REVIEW],
        deadline__isnull=False,
        deadline__lt=today,
    ).update(status=Request.Status.TIME_ENDED)

    requests_with_pending = (
        Proposal.objects.filter(status='pending').values('request_id').distinct()
    )
    Request.objects.filter(
        status=Request.Status.IN_REVIEW,
    ).filter(
        Q(deadline__isnull=True) | Q(deadline__gte=today)
    ).exclude(
        id__in=requests_with_pending
    ).update(status=Request.Status.OPEN)
    cache.set(cache_key, True, timeout=60)


@api_view(['GET'])
@permission_classes([AllowAny])
def request_list_api(request):
    _refresh_time_based_statuses()

    qs = (
        Request.objects
        .select_related('requester', 'category')
        .prefetch_related('images')
        .annotate(proposal_count=Count('proposals'))
    )

    user = request.user
    is_artisan = user.is_authenticated and user.groups.filter(name='artisan').exists()

    # Visibility rules
    if not is_artisan:
        if user.is_authenticated:
            qs = qs.filter(Q(status=Request.Status.CLOSED) | Q(requester=user))
        else:
            qs = qs.filter(status=Request.Status.CLOSED)

    params = request.query_params
    search_query = (params.get('q') or '').strip()
    category = (params.get('category') or '').strip()
    status_filter = (params.get('status') or '').strip()
    sort = (params.get('sort') or 'newest').strip()
    mine = (params.get('mine') or '').strip()

    valid_statuses = {c[0] for c in Request.Status.choices}

    if mine == '1' and user.is_authenticated:
        qs = qs.filter(requester=user)

    if search_query:
        qs = qs.filter(
            Q(title__icontains=search_query)
            | Q(description__icontains=search_query)
            | Q(category__name__icontains=search_query)
            | Q(requester__username__icontains=search_query)
        )

    if category.isdigit():
        qs = qs.filter(category_id=int(category))

    if status_filter in valid_statuses:
        qs = qs.filter(status=status_filter)

    if sort == 'deadline_soon':
        qs = qs.order_by(F('deadline').asc(nulls_last=True), '-created_at')
    elif sort == 'budget_high':
        qs = qs.order_by(F('budget_max').desc(nulls_last=True), '-created_at')
    elif sort == 'budget_low':
        qs = qs.order_by(F('budget_max').asc(nulls_last=True), '-created_at')
    elif sort == 'oldest':
        qs = qs.order_by('created_at')
    else:
        qs = qs.order_by('-created_at')

    total_count = qs.count()
    try:
        per_page = int(params.get('per_page') or 9)
    except (TypeError, ValueError):
        per_page = 9
    per_page = max(1, min(per_page, 50))
    paginator = Paginator(qs, per_page)
    
    page_obj = paginator.get_page(params.get('page'))

    return Response({
        'results': RequestListSerializer(
            page_obj.object_list, many=True, context={'request': request}
        ).data,
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_count': total_count,
            'start_index': page_obj.start_index() if total_count else 0,
            'end_index': page_obj.end_index() if total_count else 0,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
            'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
        },
        'categories': [
            {'id': c.id, 'name': c.name} for c in Category.objects.order_by('name')
        ],
        'status_choices': [
            {'value': value, 'label': label} for value, label in Request.Status.choices
        ],
        'current_mine': mine,
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def request_detail_api(request, request_id):
    _refresh_time_based_statuses()

    req = get_object_or_404(
        Request.objects.select_related('requester', 'category').prefetch_related('images'),
        id=request_id,
    )

    user = request.user
    is_artisan = user.is_authenticated and user.groups.filter(name='artisan').exists()
    is_requester = user.is_authenticated and req.requester_id == user.id

    # Match list-view visibility: non-artisan non-requester only sees CLOSED
    if not is_artisan and not is_requester and req.status != Request.Status.CLOSED:
        return Response(
            {'detail': 'This request is not available.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Mark pending invitations as VIEWED (for artisans)
    if is_artisan and not is_requester:
        Invitation.objects.filter(
            request=req,
            artisan=user,
            status=Invitation.Status.PENDING,
        ).update(status=Invitation.Status.VIEWED)

    serializer = RequestDetailSerializer(req, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def suggested_artisans_api(request):
    category_id = (request.query_params.get('category_id') or '').strip()
    if not category_id.isdigit():
        return Response({'artisans': []})

    request_id = request.query_params.get('request_id')
    invited_ids = set()
    if request_id and request.user.is_authenticated:
        try:
            req = Request.objects.get(id=request_id, requester=request.user)
            invited_ids = set(req.invitations.values_list('artisan_id', flat=True))
        except Request.DoesNotExist:
            pass

    workshops = (
        WorkshopProfile.objects.select_related('artisan__user')
        .filter(
            is_published=True,
            categories__id=int(category_id),
        )
        .order_by('-artisan__is_verified', '-artisan__average_rating', '-id')
        .distinct()[:6]
    )

    serializer = SuggestedArtisanSerializer(
        workshops,
        many=True,
        context={'invited_ids': invited_ids},
    )
    return Response({'artisans': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_artisan_api(request, request_id):
    req = get_object_or_404(Request, id=request_id)

    if req.requester_id != request.user.id:
        return Response({'error': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    if req.status != Request.Status.OPEN:
        return Response({'error': 'Request is not open.'}, status=status.HTTP_400_BAD_REQUEST)

    artisan_user_id = request.data.get('artisan_user_id')
    if not artisan_user_id:
        return Response({'error': 'artisan_user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth.models import User
    artisan_user = get_object_or_404(User, id=artisan_user_id)

    if not artisan_user.groups.filter(name='artisan').exists():
        return Response({'error': 'User is not an artisan.'}, status=status.HTTP_400_BAD_REQUEST)

    existing = Invitation.objects.filter(request=req, artisan=artisan_user).first()
    if existing:
        return Response(
            {'message': 'Already invited.', 'invitation_id': existing.id},
            status=status.HTTP_409_CONFLICT,
        )

    # NOTE: The Invitation model may require extra fields depending on your app.
    # Adjust this create call to match your actual model.
    inv = Invitation.objects.create(request=req, artisan=artisan_user)

    return Response(
        {'message': 'Invitation sent.', 'invitation_id': inv.id},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reopen_request_api(request, request_id):
    req = get_object_or_404(Request, id=request_id)

    if req.requester_id != request.user.id:
        return Response({'error': 'Only the requester can reopen this request.'}, status=status.HTTP_403_FORBIDDEN)

    if req.status != Request.Status.TIME_ENDED:
        return Response({'error': 'Only time-ended requests can be reopened.'}, status=status.HTTP_400_BAD_REQUEST)

    new_deadline_str = (request.data.get('new_deadline') or '').strip()
    if not new_deadline_str:
        return Response({'error': 'Please provide a new deadline.'}, status=status.HTTP_400_BAD_REQUEST)

    from datetime import date
    try:
        new_deadline = date.fromisoformat(new_deadline_str)
        if new_deadline <= timezone.localdate():
            return Response({'error': 'The new deadline must be in the future.'}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({'error': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)

    has_pending = req.proposals.filter(status='pending').exists()
    req.deadline = new_deadline
    req.status = Request.Status.IN_REVIEW if has_pending else Request.Status.OPEN
    req.save(update_fields=['deadline', 'status'])

    return Response({'message': 'Request reopened.', 'status': req.status})





def _handle_image_uploads(req, request):
    """Save uploaded files + captions. Skip image moderation for now."""
    files = request.FILES.getlist('images')
    captions_raw = request.data.get('captions', '')
    try:
        import json
        captions = json.loads(captions_raw) if captions_raw else []
    except (ValueError, TypeError):
        captions = []

    max_count = 5
    existing = req.images.count()
    slots = max(0, max_count - existing)
    files = files[:slots]

    saved = []
    for i, f in enumerate(files):
        caption = (captions[i] if i < len(captions) else '')[:160]
        img = RequestImage.objects.create(request=req, image=f, caption=caption)
        saved.append({'id': img.id, 'url': img.image.url, 'caption': img.caption})
    return saved


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_create_api(request):
    serializer = RequestCreateUpdateSerializer(
        data=request.data, context={'request': request}
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    req = serializer.save()
    _handle_image_uploads(req, request)

    # Return the full detail so React can redirect and show it
    return Response(
        RequestDetailSerializer(req, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST', 'PATCH'])
@permission_classes([IsAuthenticated])
def request_update_api(request, request_id):
    req = get_object_or_404(Request, id=request_id)

    if req.requester_id != request.user.id:
        return Response(
            {'detail': 'You can only edit your own requests.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if req.status in (Request.Status.CLOSED, Request.Status.TIME_ENDED):
        return Response(
            {'detail': 'This request is no longer editable.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = RequestCreateUpdateSerializer(
        req,
        data=request.data,
        partial=(request.method == 'PATCH'),
        context={'request': request},
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()

    # Update existing image captions
    try:
        import json
        updates_raw = request.data.get('existing_image_updates', '')
        updates = json.loads(updates_raw) if updates_raw else {}
        for img_id_str, new_caption in updates.items():
            try:
                img = req.images.get(id=int(img_id_str))
                img.caption = (new_caption or '')[:160]
                img.save(update_fields=['caption'])
            except (RequestImage.DoesNotExist, ValueError):
                pass
    except (ValueError, TypeError):
        pass

    # Delete images
    try:
        import json
        deletes_raw = request.data.get('delete_image_ids', '')
        delete_ids = json.loads(deletes_raw) if deletes_raw else []
        if delete_ids:
            req.images.filter(id__in=delete_ids).delete()
    except (ValueError, TypeError):
        pass

    # Add new images
    _handle_image_uploads(req, request)

    return Response(RequestDetailSerializer(req, context={'request': request}).data)