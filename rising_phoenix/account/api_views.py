from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    RegisterArtisanSerializer,
    UserSerializer,
    ProfileSerializer,
    ArtisanProfileSerializer,
)
from .models import Profile, ArtisanProfile


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


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    is_artisan = user.groups.filter(name='artisan').exists()

    if request.method == 'GET':
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