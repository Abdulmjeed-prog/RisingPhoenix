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