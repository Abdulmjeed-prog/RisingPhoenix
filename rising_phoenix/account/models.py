from django.db import models
from django.contrib.auth.models import User
from phonenumber_field.modelfields import PhoneNumberField
from request.models import Request
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
# Create your models here.

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="images/avatars/", default="images/avatars/default_avatar.png")
    phone = PhoneNumberField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_banned = models.BooleanField(default=False)
    ban_reason = models.TextField(blank=True)
    is_phone_verified = models.BooleanField(default=False)  
    def __str__(self):
        return f"Profile {self.user.username}"

class ArtisanProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    stripe_connected_account_id = models.CharField(max_length=255, blank=True, null=True)
    phone = PhoneNumberField()
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="images/avatars/", default="images/avatars/default_avatar.png")
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    completed_jobs = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_banned = models.BooleanField(default=False)
    ban_reason = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"ArtisanProfile - {self.user.username}"
    
class Review(models.Model):
    class Rate(models.IntegerChoices):
        ONE = 1, '1 Star'
        TWO = 2, '2 Stars'
        THREE = 3, '3 Stars'
        FOUR = 4, '4 Stars'
        FIVE = 5, '5 Stars'

    request = models.OneToOneField(
        Request,
        on_delete=models.CASCADE,
        related_name='review'
    )
    reviews_given = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    reviews_received = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_received'
    )
    rating = models.PositiveSmallIntegerField(
        choices=Rate.choices
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.request} - {self.rating} stars"


def _recalc_artisan_rating(artisan_user):
    avg = artisan_user.reviews_received.aggregate(v=Avg('rating'))['v'] or 0
    ArtisanProfile.objects.filter(user=artisan_user).update(average_rating=round(avg, 2))


@receiver(post_save, sender=Review)
def review_saved(sender, instance, **kwargs):
    _recalc_artisan_rating(instance.reviews_received)


@receiver(post_delete, sender=Review)
def review_deleted(sender, instance, **kwargs):
    _recalc_artisan_rating(instance.reviews_received)



class ArtisanRevenue(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        EARNED = 'earned', 'Earned'
        PAID = 'paid', 'Paid'
        CANCELED = 'canceled', 'Canceled'

    artisan = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='revenues'
    )
    contract = models.OneToOneField(
        'progress.Contract',
        on_delete=models.CASCADE,
        related_name='revenue'
    )
    
    escrow_payment = models.OneToOneField(
        'payment.EscrowPayment',
        on_delete=models.CASCADE,
        related_name='revenue'
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.EARNED
    )

    paid_out_at = models.DateTimeField(null=True, blank=True)
    payout_reference = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.artisan.username} - {self.net_amount}"
