from django.contrib.auth.models import User, Group
from rest_framework import serializers
from phonenumber_field.serializerfields import PhoneNumberField
from .models import Profile, ArtisanProfile


class ProfileSerializer(serializers.ModelSerializer):
    phone = PhoneNumberField()

    class Meta:
        model = Profile
        fields = ['bio', 'avatar', 'phone', 'is_phone_verified', 'is_banned', 'ban_reason', 'created_at']
        read_only_fields = ['is_phone_verified', 'is_banned', 'ban_reason', 'created_at']


class ArtisanProfileSerializer(serializers.ModelSerializer):
    phone = PhoneNumberField()

    class Meta:
        model = ArtisanProfile
        fields = [
            'bio', 'avatar', 'phone', 'average_rating', 'completed_jobs',
            'is_verified', 'is_banned', 'ban_reason', 'is_featured',
            'is_phone_verified', 'stripe_connected_account_id', 'created_at',
        ]
        read_only_fields = [
            'average_rating', 'completed_jobs', 'is_verified',
            'is_banned', 'ban_reason', 'is_featured',
            'is_phone_verified', 'stripe_connected_account_id', 'created_at',
        ]


class UserSerializer(serializers.ModelSerializer):
    """Read-only view of the logged-in user + profile."""
    profile = serializers.SerializerMethodField()
    is_artisan = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_artisan', 'profile']
        read_only_fields = ['id', 'is_staff']

    def get_is_artisan(self, obj):
        return obj.groups.filter(name='artisan').exists()

    def get_profile(self, obj):
        if obj.groups.filter(name='artisan').exists():
            ap = getattr(obj, 'artisanprofile', None)
            return ArtisanProfileSerializer(ap).data if ap else None
        p = getattr(obj, 'profile', None)
        return ProfileSerializer(p).data if p else None


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=5, max_length=20)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    phone = PhoneNumberField()
    bio = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False)
    default_avatar = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        from django.db import transaction
        from notification.utils import send_welcome_email

        validated_data.pop('password2')
        phone = validated_data.pop('phone')
        bio = validated_data.pop('bio', '')
        avatar = validated_data.pop('avatar', None)
        default_avatar = validated_data.pop('default_avatar', '')
        password = validated_data.pop('password')

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                email=validated_data['email'],
                password=password,
            )

            profile = Profile(user=user, phone=phone, bio=bio)
            if avatar:
                profile.avatar = avatar
            elif default_avatar:
                profile.avatar = f'images/avatars/defaults/{default_avatar}'
            else:
                profile.avatar = 'images/avatars/defaults/avatar1.png'
            profile.save()

        try:
            send_welcome_email(user)
        except Exception:
            pass

        return user

class RegisterArtisanSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=5, max_length=20)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    phone = PhoneNumberField()
    bio = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False)
    default_avatar = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        from django.db import transaction
        from notification.utils import send_artisan_welcome_email

        validated_data.pop('password2')
        phone = validated_data.pop('phone')
        bio = validated_data.pop('bio', '')
        avatar = validated_data.pop('avatar', None)
        default_avatar = validated_data.pop('default_avatar', '')
        password = validated_data.pop('password')

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                email=validated_data['email'],
                password=password,
            )

            artisan_group, _ = Group.objects.get_or_create(name='artisan')
            user.groups.add(artisan_group)

            profile = ArtisanProfile(user=user, phone=phone, bio=bio)
            if avatar:
                profile.avatar = avatar
            elif default_avatar:
                profile.avatar = f'images/avatars/defaults/{default_avatar}'
            else:
                profile.avatar = 'images/avatars/defaults/avatar1.png'
            profile.save()

        try:
            send_artisan_welcome_email(user)
        except Exception:
            pass

        return user

class ActiveContractSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.SerializerMethodField()
    requester_name = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    def get_title(self, obj):
        try:
            return obj.proposal.request.title
        except Exception:
            return ''

    def get_requester_name(self, obj):
        try:
            requester = obj.proposal.request.requester
            return requester.get_full_name() or requester.username
        except Exception:
            return ''

    def get_price(self, obj):
        try:
            return str(obj.proposal.price)
        except Exception:
            return '0.00'



class CompletedContractSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.SerializerMethodField()
    requester_name = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    def get_title(self, obj):
        try:
            return obj.proposal.request.title
        except Exception:
            return ''

    def get_requester_name(self, obj):
        try:
            requester = obj.proposal.request.requester
            return requester.get_full_name() or requester.username
        except Exception:
            return ''

    def get_price(self, obj):
        try:
            return str(obj.proposal.price)
        except Exception:
            return '0.00'


class RevenueSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    net_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    contract_title = serializers.SerializerMethodField()

    def get_contract_title(self, obj):
        try:
            return obj.contract.title or '—'
        except Exception:
            return '—'


class PublicProfileSerializer(serializers.Serializer):
    """One endpoint for all three roles: regular user, artisan, staff."""
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()
    date_joined = serializers.DateTimeField()
    is_staff = serializers.BooleanField()
    is_artisan = serializers.SerializerMethodField()
    is_own_profile = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()

    def get_is_artisan(self, obj):
        return obj.groups.filter(name='artisan').exists()

    def get_is_own_profile(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and request.user.id == obj.id)

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        val = obj.reviews_received.aggregate(v=Avg('rating'))['v']
        if val is None:
            return None
        return round(float(val), 2)

    def get_profile(self, obj):
        is_artisan = obj.groups.filter(name='artisan').exists()

        if is_artisan:
            ap = getattr(obj, 'artisanprofile', None)
            if not ap:
                return None
            return {
                'bio': ap.bio or '',
                'avatar': ap.avatar.url if ap.avatar else None,
                'phone': str(ap.phone) if ap.phone else '',
                'is_phone_verified': ap.is_phone_verified,
                'is_verified': ap.is_verified,
                'is_featured': ap.is_featured,
                'is_banned': ap.is_banned,
            }

        # Regular user (or staff)
        p = getattr(obj, 'profile', None)
        if not p:
            return None
        return {
            'bio': p.bio or '',
            'avatar': p.avatar.url if p.avatar else None,
            'phone': str(p.phone) if p.phone else '',
            'is_phone_verified': p.is_phone_verified,
            'is_verified': False,
            'is_featured': False,
            'is_banned': p.is_banned,
        }