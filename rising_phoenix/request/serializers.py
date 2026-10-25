from rest_framework import serializers
from .models import Request
from rest_framework import serializers
from django.contrib.auth.models import User
from proposal.models import Proposal
from invitation.models import Invitation
from .models import Request, RequestImage


class RequestListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField()
    status_display = serializers.SerializerMethodField()
    category_id = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    requester_username = serializers.SerializerMethodField()
    budget_max = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    proposal_count = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_category_id(self, obj):
        return obj.category_id if obj.category else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''

    def get_requester_username(self, obj):
        return obj.requester.username if obj.requester else ''

    def get_budget_max(self, obj):
        return str(obj.budget_max) if obj.budget_max is not None else None

    def get_deadline(self, obj):
        return obj.deadline.isoformat() if obj.deadline else None

    def get_proposal_count(self, obj):
        # Annotated in the queryset — fallback to a count if missing
        return getattr(obj, 'proposal_count', obj.proposals.count())

    def get_cover_image(self, obj):
        first = obj.images.first()
        return first.image.url if first and first.image else None

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return bool(
            request and request.user.is_authenticated and obj.requester_id == request.user.id
        )

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.requester_id != request.user.id:
            return False
        return obj.status not in (Request.Status.CLOSED, Request.Status.TIME_ENDED)


    def get_images(self, obj):
        return [
            {
                'id': img.id,
                'url': img.image.url if img.image else None,
                'caption': img.caption or '',
            }
            for img in obj.images.all()
        ]


class RequestImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = RequestImage
        fields = ['id', 'url', 'caption']

    def get_url(self, obj):
        return obj.image.url if obj.image else None


class ProposalImageSerializer(serializers.Serializer):
    """Lightweight — reads from proposal.images.all()"""
    def to_representation(self, obj):
        return {
            'id': obj.id,
            'url': obj.image.url if obj.image else None,
            'caption': obj.caption or '',
        }


class ProposalDetailSerializer(serializers.ModelSerializer):
    artisan_username = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    conversation_id = serializers.SerializerMethodField()
    contract_id = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            'id', 'artisan_username', 'price', 'estimated_days',
            'message', 'status', 'status_display', 'created_at',
            'images', 'conversation_id', 'contract_id',
        ]

    def get_artisan_username(self, obj):
        return obj.artisan.username if obj.artisan else ''

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_images(self, obj):
        return ProposalImageSerializer().to_representation(obj)['images'] if False else [
            {
                'id': img.id,
                'url': img.image.url if img.image else None,
                'caption': img.caption or '',
            }
            for img in obj.images.all()
        ]

    def get_conversation_id(self, obj):
        # Some proposals may not have a conversation yet
        conv = getattr(obj, 'conversation', None)
        return conv.id if conv else None

    def get_contract_id(self, obj):
        try:
            c = getattr(obj, 'contract', None)
            return c.id if c else None
        except Exception:
            return None


class InvitationSerializer(serializers.ModelSerializer):
    artisan_username = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = ['id', 'artisan_username', 'status', 'status_display', 'created_at']

    def get_artisan_username(self, obj):
        return obj.artisan.username if obj.artisan else ''

    def get_status_display(self, obj):
        return obj.get_status_display()


class ReviewBriefSerializer(serializers.Serializer):
    """Brief review data — only present when request has one."""
    reviewer_name = serializers.SerializerMethodField()
    rating = serializers.IntegerField()
    comment = serializers.CharField(allow_blank=True)
    created_at = serializers.DateTimeField()
    reviewer_initial = serializers.SerializerMethodField()

    def get_reviewer_name(self, obj):
        return obj.reviews_given.get_full_name() or obj.reviews_given.username

    def get_reviewer_initial(self, obj):
        name = obj.reviews_given.first_name or obj.reviews_given.username
        return name[:1].upper() if name else '?'


class RequestDetailSerializer(serializers.ModelSerializer):
    # Request fields
    category_name = serializers.SerializerMethodField()
    requester_username = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()

    # Role + permissions
    is_requester = serializers.SerializerMethodField()
    is_artisan = serializers.SerializerMethodField()
    can_submit = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_reopen = serializers.SerializerMethodField()

    # Nested data (only when applicable)
    proposals = serializers.SerializerMethodField()
    user_proposal = serializers.SerializerMethodField()
    invitations = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = [
            'id', 'title', 'description', 'budget_max', 'deadline',
            'status', 'status_display', 'category_name', 'requester_username',
            'created_at', 'images', 'is_requester', 'is_artisan',
            'can_submit', 'can_edit', 'can_reopen',
            'proposals', 'user_proposal', 'invitations', 'review',
        ]

    def _user(self):
        request = self.context.get('request')
        return request.user if request and request.user.is_authenticated else None

    def _is_artisan(self):
        u = self._user()
        return bool(u and u.groups.filter(name='artisan').exists())

    def _is_requester(self, obj):
        u = self._user()
        return bool(u and obj.requester_id == u.id)

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''

    def get_requester_username(self, obj):
        return obj.requester.username if obj.requester else ''

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_deadline(self, obj):
        return obj.deadline.isoformat() if obj.deadline else None

    def get_images(self, obj):
        return RequestImageSerializer(obj.images.all(), many=True).data

    def get_is_requester(self, obj):
        return self._is_requester(obj)

    def get_is_artisan(self, obj):
        return self._is_artisan()

    def get_can_submit(self, obj):
        u = self._user()
        if not u or not self._is_artisan() or self._is_requester(obj):
            return False
        if obj.status not in (Request.Status.OPEN, Request.Status.IN_REVIEW):
            return False
        return not obj.proposals.filter(artisan=u).exists()

    def get_can_edit(self, obj):
        if not self._is_requester(obj):
            return False
        return obj.status not in (Request.Status.CLOSED, Request.Status.TIME_ENDED)

    def get_can_reopen(self, obj):
        return self._is_requester(obj) and obj.status == Request.Status.TIME_ENDED

    def get_proposals(self, obj):
        # Only the requester sees ALL proposals
        if not self._is_requester(obj):
            return []
        qs = obj.proposals.select_related('artisan').order_by('-created_at')
        return ProposalDetailSerializer(qs, many=True).data

    def get_user_proposal(self, obj):
        u = self._user()
        if not u or self._is_requester(obj) or not self._is_artisan():
            return None
        p = obj.proposals.filter(artisan=u).first()
        return ProposalDetailSerializer(p).data if p else None

    def get_invitations(self, obj):
        if not self._is_requester(obj):
            return []
        qs = obj.invitations.select_related('artisan').order_by('-created_at')
        return InvitationSerializer(qs, many=True).data

    def get_review(self, obj):
        try:
            r = obj.review
        except Exception:
            return None
        return ReviewBriefSerializer(r).data


class SuggestedArtisanSerializer(serializers.Serializer):
    """Lightweight artisan suggestion for the invite section."""
    id = serializers.IntegerField()
    workshop_name = serializers.SerializerMethodField()
    tagline = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    artisan_username = serializers.SerializerMethodField()
    artisan_user_id = serializers.SerializerMethodField()
    already_invited = serializers.SerializerMethodField()

    def get_workshop_name(self, obj):
        return obj.workshop_name or ''

    def get_tagline(self, obj):
        return obj.tagline or ''

    def get_location(self, obj):
        return obj.location or ''

    def get_artisan_username(self, obj):
        return obj.artisan.user.username

    def get_artisan_user_id(self, obj):
        return obj.artisan.user_id

    def get_already_invited(self, obj):
        invited_ids = self.context.get('invited_ids', set())
        return obj.artisan.user_id in invited_ids

class RequestCreateUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    category = serializers.IntegerField()
    budget_max = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    deadline = serializers.DateField(required=False, allow_null=True)

    def validate_category(self, value):
        from workshop.models import Category
        if not Category.objects.filter(id=value).exists():
            raise serializers.ValidationError('Category not found.')
        return value

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 4:
            raise serializers.ValidationError('Title must be at least 4 characters.')
        return value

    def validate_description(self, value):
        value = value.strip()
        if len(value) < 20:
            raise serializers.ValidationError('Description must be at least 20 characters.')
        return value

    def create(self, validated_data):
        from django.utils import timezone
        from workshop.models import Category
        from .models import Request

        user = self.context['request'].user
        category = Category.objects.get(id=validated_data['category'])

        req = Request.objects.create(
            requester=user,
            category=category,
            title=validated_data['title'],
            description=validated_data['description'],
            budget_max=validated_data.get('budget_max'),
            deadline=validated_data.get('deadline'),
        )
        return req

    def update(self, instance, validated_data):
        from workshop.models import Category

        if 'category' in validated_data:
            instance.category = Category.objects.get(id=validated_data['category'])
        for field in ('title', 'description', 'budget_max', 'deadline'):
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        return instance
