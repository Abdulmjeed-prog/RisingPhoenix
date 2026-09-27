from django.db.models import Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from request.models import Request
from workshop.models import WorkshopProfile
from workshop.models import Category   # ← adjust if Category lives elsewhere
from .serializers import CategorySerializer, HomeRequestSerializer, HomeWorkshopSerializer


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