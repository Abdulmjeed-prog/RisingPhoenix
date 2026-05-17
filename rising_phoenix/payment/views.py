from decimal import Decimal

from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.contrib.auth import get_user_model

from notification.utils import notify
from .models import StripeCustomer, PaymentMethod, EscrowPayment
from django.conf import settings
from django.contrib import messages
import stripe
from request.models import Request
from proposal.models import Proposal
from django.db import transaction
from progress.models import Contract
from notification.models import Notification
# Create your views here.

stripe.api_key = settings.STRIPE_SECRET_KEY



def my_cards_view(request):

    cards = PaymentMethod.objects.filter(user=request.user).order_by('-is_default', '-created_at')
    return render(request, 'payment/my_cards.html', {'cards': cards})

def get_or_create_stripe_customer(user):
    customer_obj, created = StripeCustomer.objects.get_or_create(user=user)

    if customer_obj.stripe_customer_id:
        return customer_obj.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.username
    )
    customer_obj.stripe_customer_id = customer.id
    customer_obj.save()
    return customer.id



def add_card_view(request):

    stripe_customer_id = get_or_create_stripe_customer(request.user)
    setup_intent = stripe.SetupIntent.create(
        customer=stripe_customer_id,
        payment_method_types=['card'],
        usage='off_session'
    )

    return render(request, 'payment/add_card.html', {
        'client_secret': setup_intent.client_secret,
        'stripe_publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
    })


def save_card_success(request):

    setup_intent_id = request.GET.get('setup_intent')
    if not setup_intent_id:
        return redirect('payment:add_card')

    setup_intent = stripe.SetupIntent.retrieve(setup_intent_id)
    payment_method_id = setup_intent.payment_method
    stripe_customer_id = setup_intent.customer
    payment_method = stripe.PaymentMethod.retrieve(payment_method_id)

    obj, created = PaymentMethod.objects.get_or_create(
        stripe_payment_method_id=payment_method_id,
        defaults={
            'user': request.user,
            'stripe_customer_id': stripe_customer_id,
            'brand': payment_method.card.brand,
            'last4': payment_method.card.last4,
            'exp_month': payment_method.card.exp_month,
            'exp_year': payment_method.card.exp_year,
            'is_default': not PaymentMethod.objects.filter(user=request.user).exists(),
        }
    )

    return redirect('payment:my_cards')


def proposal_checkout_view(request, proposal_id):
    proposal = get_object_or_404(
        Proposal.objects.select_related('request', 'artisan'),
        id=proposal_id
    )
    project_request = proposal.request

    if project_request.requester != request.user:
        messages.error(request, 'Only the requester can pay for this proposal.')
        return redirect('request:request_detail_view', request_id=project_request.id)

    if not proposal.is_pending:
        messages.error(request, 'This proposal is no longer pending.')
        return redirect('request:request_detail_view', request_id=project_request.id)

    if project_request.status == Request.Status.CLOSED:
        messages.error(request, 'This request is already closed.')
        return redirect('request:request_detail_view', request_id=project_request.id)

    cards = request.user.payment_methods.all().order_by('-is_default', '-created_at')

    context = {
        'proposal': proposal,
        'project_request': project_request,
        'cards': cards,
        'default_card': cards.filter(is_default=True).first(),
    }
    return render(request, 'payment/proposal_checkout.html', context)


def confirm_proposal_payment_view(request, proposal_id):
    proposal = get_object_or_404(
        Proposal.objects.select_related('request', 'artisan'),
        id=proposal_id
    )
    project_request = proposal.request

    if project_request.requester != request.user:
        messages.error(request, 'Only the requester can pay for this proposal.')
        return redirect('request:request_detail_view', request_id=project_request.id)

    if not proposal.is_pending:
        messages.error(request, 'This proposal is no longer pending.')
        return redirect('request:request_detail_view', request_id=project_request.id)

    if project_request.status == Request.Status.CLOSED:
        messages.error(request, 'This request is already closed.')
        return redirect('request:request_detail_view', request_id=project_request.id)

    payment_method_id = request.POST.get('payment_method')
    if not payment_method_id:
        messages.error(request, 'Please select a payment method.')
        return redirect('payment:proposal_checkout_view', proposal_id=proposal.id)

    stripe_customer = getattr(request.user, 'stripe_customer', None)
    if not stripe_customer:
        messages.error(request, 'Please add a card first.')
        return redirect('payment:add_card')

    selected_card = request.user.payment_methods.filter(
        stripe_payment_method_id=payment_method_id
    ).first()

    if not selected_card:
        messages.error(request, 'Selected payment method is invalid.')
        return redirect('payment:proposal_checkout_view', proposal_id=proposal.id)

    amount_in_halalas = int(Decimal(proposal.price) * 100)

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_in_halalas,
            currency='sar',
            customer=stripe_customer.stripe_customer_id,
            payment_method=selected_card.stripe_payment_method_id,
            confirm=True,
            off_session=True,
            capture_method='manual',
            metadata={
                'proposal_id': str(proposal.id),
                'request_id': str(project_request.id),
                'requester_id': str(request.user.id),
                'artisan_id': str(proposal.artisan.id),
            }
        )
    except stripe.error.CardError as e:
        messages.error(request, e.user_message or 'Your card was declined.')
        return redirect('payment:proposal_checkout_view', proposal_id=proposal.id)
    except stripe.error.StripeError:
        messages.error(request, 'Unable to process payment right now.')
        return redirect('payment:proposal_checkout_view', proposal_id=proposal.id)

    if payment_intent.status != 'requires_capture':
        messages.error(request, f'Payment authorization failed. Status: {payment_intent.status}')
        return redirect('payment:proposal_checkout_view', proposal_id=proposal.id)

    with transaction.atomic():
        proposal.status = Proposal.Status.ACCEPTED
        proposal.save(update_fields=['status', 'updated_at'])

        rejected_artisans = list(
            project_request.proposals
            .filter(status=Proposal.Status.PENDING)
            .exclude(id=proposal.id)
            .values_list('artisan', flat=True)
        )

        project_request.proposals.filter(
            status=Proposal.Status.PENDING
        ).exclude(id=proposal.id).update(
            status=Proposal.Status.REJECTED
        )

        project_request.status = Request.Status.CLOSED
        project_request.save(update_fields=['status'])

        contract, _ = Contract.objects.get_or_create(proposal=proposal)

        EscrowPayment.objects.create(
            requester=request.user,
            proposal=proposal,
            contract=contract,
            stripe_payment_intent_id=payment_intent.id,
            stripe_customer_id=stripe_customer.stripe_customer_id,
            stripe_payment_method_id=selected_card.stripe_payment_method_id,
            amount=proposal.price,
            currency='sar',
            status='authorized',
            captured=False,
        )

    for artisan in get_user_model().objects.filter(id__in=rejected_artisans):
        notify(
            artisan,
            Notification.NotifType.PROPOSAL_REJECTED,
            'Your proposal was not selected',
            body=f'The requester went with another proposal for "{project_request.title}". Good luck with your other proposals!',
            link=reverse('request:request_detail_view', kwargs={'request_id': project_request.id}),
        )

    notify(
        proposal.artisan,
        Notification.NotifType.PROPOSAL_ACCEPTED,
        'Your proposal was accepted!',
        body=f'You were chosen for "{project_request.title}". Escrow payment has been authorized.',
        link=reverse('progress:contract_detail_view', kwargs={'contract_id': contract.id}),
    )

    messages.success(request, 'Payment authorized and proposal accepted successfully.')
    return redirect('progress:contract_detail_view', contract_id=contract.id)


    
