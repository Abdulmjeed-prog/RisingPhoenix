from django.db import models
from django.conf import settings
from progress.models import Contract
from proposal.models import Proposal

# Create your models here.

class PaymentMethod(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    stripe_customer_id = models.CharField(max_length=255)
    stripe_payment_method_id = models.CharField(max_length=255, unique=True)
    brand = models.CharField(max_length=50, blank=True)
    last4 = models.CharField(max_length=4, blank=True)
    exp_month = models.PositiveSmallIntegerField(null=True, blank=True)
    exp_year = models.PositiveSmallIntegerField(null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.brand} **** {self.last4}"
    
class StripeCustomer(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stripe_customer')
    stripe_customer_id = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"{self.user.username} - {self.stripe_customer_id}"
    

class EscrowPayment(models.Model):
    STATUS_CHOICES = [
        ('requires_payment_method', 'Requires Payment Method'),
        ('requires_action', 'Requires Action'),
        ('processing', 'Processing'),
        ('authorized', 'Authorized'),
        ('captured', 'Captured'),
        ('canceled', 'Canceled'),
        ('failed', 'Failed'),
    ]

    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='escrow_payments')
    proposal = models.OneToOneField(Proposal, on_delete=models.CASCADE, related_name='escrow_payment')
    contract = models.OneToOneField(Contract, on_delete=models.SET_NULL, null=True, blank=True, related_name='escrow_payment')

    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    stripe_customer_id = models.CharField(max_length=255)
    stripe_payment_method_id = models.CharField(max_length=255)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='sar')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='requires_payment_method')
    captured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Escrow for proposal #{self.proposal.id}'