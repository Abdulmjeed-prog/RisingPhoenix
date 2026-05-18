from decimal import Decimal, ROUND_HALF_UP
from calendar import monthrange
from datetime import date, timedelta

import stripe
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from account.models import ArtisanRevenue


stripe.api_key = settings.STRIPE_SECRET_KEY

USD_PER_SAR = Decimal('0.2666')  # testing placeholder


def get_previous_month_period(today=None):
    today = today or timezone.localdate()
    first_day_this_month = date(today.year, today.month, 1)
    last_day_previous_month = first_day_this_month - timedelta(days=1)
    first_day_previous_month = date(
        last_day_previous_month.year,
        last_day_previous_month.month,
        1
    )
    return first_day_previous_month, last_day_previous_month


def get_current_month_period(today=None):
    today = today or timezone.localdate()
    first_day = date(today.year, today.month, 1)
    last_day = date(today.year, today.month, monthrange(today.year, today.month)[1])
    return first_day, last_day


def get_payout_period(period_type='previous', today=None):
    if period_type == 'current':
        return get_current_month_period(today)
    return get_previous_month_period(today)


def convert_sar_to_usd(amount_sar: Decimal) -> Decimal:
    return (amount_sar * USD_PER_SAR).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def process_monthly_artisan_payouts(target_date=None, period_type='previous'):
    period_start, period_end = get_payout_period(period_type=period_type, today=target_date)

    unpaid_revenues = (
        ArtisanRevenue.objects
        .filter(
            status=ArtisanRevenue.Status.EARNED,
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
        )
        .select_related('artisan', 'artisan__artisanprofile')
        .order_by('artisan_id', 'created_at')
    )

    artisan_ids = unpaid_revenues.values_list('artisan_id', flat=True).distinct()

    processed = []
    failed = []

    for artisan_id in artisan_ids:
        artisan_rows = unpaid_revenues.filter(artisan_id=artisan_id)
        first_row = artisan_rows.first()
        if not first_row:
            continue

        artisan = first_row.artisan
        total_sar = artisan_rows.aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')

        if total_sar <= 0:
            continue

        connected_account_id = getattr(artisan.artisanprofile, 'stripe_connected_account_id', None)
        if not connected_account_id:
            failed.append({
                'artisan_id': artisan.id,
                'artisan_username': artisan.username,
                'reason': 'Missing Stripe connected account id',
            })
            continue

        total_usd = convert_sar_to_usd(total_sar)
        amount_in_cents_usd = int(total_usd * 100)

        if amount_in_cents_usd <= 0:
            failed.append({
                'artisan_id': artisan.id,
                'artisan_username': artisan.username,
                'reason': 'Converted USD payout amount is zero or invalid',
            })
            continue

        try:
            transfer = stripe.Transfer.create(
                amount=amount_in_cents_usd,
                currency='usd',
                destination=connected_account_id,
                description=f'{period_type.capitalize()} month payout for {artisan.username}',
                metadata={
                    'artisan_id': str(artisan.id),
                    'period_type': period_type,
                    'period_start': str(period_start),
                    'period_end': str(period_end),
                    'source_currency': 'sar',
                    'source_amount_sar': str(total_sar),
                    'destination_currency': 'usd',
                    'destination_amount_usd': str(total_usd),
                    'fx_rate_used': str(USD_PER_SAR),
                }
            )
        except stripe.error.StripeError as e:
            failed.append({
                'artisan_id': artisan.id,
                'artisan_username': artisan.username,
                'reason': str(e),
            })
            continue

        payout_reference = transfer.id
        paid_at = timezone.now()

        with transaction.atomic():
            updated_count = artisan_rows.update(
                status=ArtisanRevenue.Status.PAID,
                paid_out_at=paid_at,
                payout_reference=payout_reference,
            )

        processed.append({
            'artisan_id': artisan.id,
            'artisan_username': artisan.username,
            'total_sar': total_sar,
            'total_usd': total_usd,
            'count': updated_count,
            'transfer_id': transfer.id,
        })

    return {
        'period_type': period_type,
        'period_start': period_start,
        'period_end': period_end,
        'processed': processed,
        'failed': failed,
    }