from rest_framework import serializers
from workshop.models import Category   # ← adjust if Category lives elsewhere


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class HomeRequestSerializer(serializers.Serializer):
    """Minimal fields for the home feed — artisans viewing open requests."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    category_name = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''

    def get_cover_image(self, obj):
        first = obj.images.first()
        if first and getattr(first, 'image', None):
            return first.image.url
        return None


class HomeWorkshopSerializer(serializers.Serializer):
    """Minimal fields for the home feed — customers viewing top workshops."""
    id = serializers.IntegerField()
    workshop_name = serializers.CharField()
    tagline = serializers.CharField(allow_blank=True)
    location = serializers.CharField(allow_blank=True)
    cover_image = serializers.SerializerMethodField()
    avg_rating = serializers.FloatField()
    artisan_user_id = serializers.SerializerMethodField()

    def get_cover_image(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        return None

    def get_artisan_user_id(self, obj):
        try:
            return obj.artisan.user.id
        except AttributeError:
            return None

class BrowseArtisanSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    display_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()            # ← changed
    is_verified = serializers.SerializerMethodField()    # ← safer as method field
    workshop_name = serializers.SerializerMethodField()
    tagline = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    def _artisan_profile(self, obj):
        try:
            return obj.artisanprofile
        except Exception:
            return None

    def _workshop(self, obj):
        ap = self._artisan_profile(obj)
        if not ap:
            return None
        try:
            return ap.workshop_profile
        except Exception:
            return None

    def get_display_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username

    def get_avatar(self, obj):
        ap = self._artisan_profile(obj)
        if ap and ap.avatar:
            return ap.avatar.url
        return None

    def get_bio(self, obj):
        ap = self._artisan_profile(obj)
        return ap.bio if ap and ap.bio else ''

    def get_is_verified(self, obj):
        ap = self._artisan_profile(obj)
        return bool(ap.is_verified) if ap else False

    def get_workshop_name(self, obj):
        w = self._workshop(obj)
        return w.workshop_name if w and w.workshop_name else ''

    def get_tagline(self, obj):
        w = self._workshop(obj)
        return w.tagline if w and w.tagline else ''

    def get_location(self, obj):
        w = self._workshop(obj)
        return w.location if w and w.location else ''

    def get_categories(self, obj):
        w = self._workshop(obj)
        if not w:
            return []
        try:
            return [{'id': c.id, 'name': c.name} for c in w.categories.all()]
        except Exception:
            return []

    def get_avg_rating(self, obj):
        # `avg_rating` is set by the queryset annotation.
        # Return None if it's null so the frontend shows "No ratings yet".
        val = getattr(obj, 'avg_rating', None)
        return float(val) if val is not None else None