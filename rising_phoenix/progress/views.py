import logging

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST

from notification.models import Notification
from notification.utils import notify
from .forms import ProgressCommentForm
from .models import Contract, ContractEvent, ContractEventImage, ProgressComment, ProgressCommentImage, ProgressImage, ProgressUpdate

logger = logging.getLogger(__name__)


def _save_images(model_cls, fk_field, fk_obj, request_files, captions=None):
    """Generic image saver — reads 'images' from FILES, creates model_cls records."""
    max_size_bytes = int(float(getattr(settings, 'REQUEST_IMAGE_MAX_SIZE_MB', 5)) * 1024 * 1024)
    allowed_types = list(getattr(settings, 'REQUEST_IMAGE_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']))
    captions = captions or []
    skipped = []

    for index, image_file in enumerate(request_files.getlist('images')[:5]):
        if image_file.size > max_size_bytes:
            skipped.append(f'"{image_file.name}" exceeds the size limit.')
            continue
        if (getattr(image_file, 'content_type', '') or '').lower() not in allowed_types:
            skipped.append(f'"{image_file.name}" is not an accepted image type.')
            continue
        try:
            caption = (captions[index] if index < len(captions) else '').strip()[:160]
            model_cls.objects.create(**{fk_field: fk_obj, 'image': image_file, 'caption': caption})
        except Exception:
            logger.exception('Failed to save image "%s"', image_file.name)
            skipped.append(f'"{image_file.name}" could not be saved.')

    return skipped


@login_required
def contract_detail_view(request, contract_id):
    contract = get_object_or_404(
        Contract.objects.select_related(
            'proposal__artisan',
            'proposal__request__requester',
            'proposal__request__category',
        ),
        id=contract_id,
    )

    is_artisan   = request.user == contract.artisan
    is_requester = request.user == contract.requester

    if not (is_artisan or is_requester):
        messages.error(request, 'You do not have access to this project.')
        return redirect('main:home_view')

    updates = list(
        contract.updates
        .prefetch_related('images', 'comments__author', 'comments__images')
        .order_by('created_at')
    )
    events = list(
        contract.events
        .select_related('actor')
        .prefetch_related('images')
        .order_by('created_at')
    )
    timeline = sorted(
        [{'kind': 'update', 'obj': u} for u in updates] +
        [{'kind': 'event',  'obj': e} for e in events],
        key=lambda x: x['obj'].created_at,
    )

    latest_update_id = updates[-1].id if updates else None

    return render(request, 'progress/contract_detail.html', {
        'contract': contract,
        'timeline': timeline,
        'is_artisan': is_artisan,
        'is_requester': is_requester,
        'latest_update_id': latest_update_id,
    })


@login_required
@require_POST
def post_update_view(request, contract_id):
    contract = get_object_or_404(Contract, id=contract_id)

    if request.user != contract.artisan:
        messages.error(request, 'Only the artisan can post progress updates.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    if contract.is_completed:
        messages.error(request, 'This project is already completed.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    body = request.POST.get('body', '').strip()
    if not body:
        messages.error(request, 'Update text is required.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    update = ProgressUpdate.objects.create(contract=contract, body=body)
    captions = request.POST.getlist('image_captions')
    for msg in _save_images(ProgressImage, 'update', update, request.FILES, captions):
        messages.warning(request, f'Image skipped: {msg}')
    messages.success(request, 'Progress update posted.')
    notify(
        contract.requester,
        Notification.NotifType.PROGRESS_UPDATE,
        'New progress update on your project',
        body=body[:200] if body else '',
        link=reverse('progress:contract_detail_view', kwargs={'contract_id': contract_id}),
    )
    return redirect('progress:contract_detail_view', contract_id=contract_id)


@login_required
@require_POST
def add_comment_view(request, update_id):
    update = get_object_or_404(ProgressUpdate.objects.select_related('contract'), id=update_id)
    contract = update.contract

    if request.user not in (contract.artisan, contract.requester):
        messages.error(request, 'You do not have access to this project.')
        return redirect('main:home_view')

    if contract.is_completed:
        messages.error(request, 'This project is already completed.')
        return redirect('progress:contract_detail_view', contract_id=contract.id)

    form = ProgressCommentForm(request.POST)
    if form.is_valid():
        comment = ProgressComment.objects.create(
            update=update,
            author=request.user,
            body=form.cleaned_data['body'],
        )
        captions = request.POST.getlist('image_captions')
        for msg in _save_images(ProgressCommentImage, 'comment', comment, request.FILES, captions):
            messages.warning(request, f'Image skipped: {msg}')
        other_party = contract.artisan if request.user == contract.requester else contract.requester
        notify(
            other_party,
            Notification.NotifType.COMMENT_ADDED,
            'New feedback on your project',
            body=form.cleaned_data['body'][:200],
            link=reverse('progress:contract_detail_view', kwargs={'contract_id': contract.id}),
        )
    else:
        messages.error(request, 'Feedback cannot be empty.')

    return redirect('progress:contract_detail_view', contract_id=contract.id)


@login_required
@require_POST
def request_completion_view(request, contract_id):
    contract = get_object_or_404(Contract, id=contract_id)

    if request.user != contract.artisan:
        messages.error(request, 'Only the artisan can mark a project as complete.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    if not contract.is_in_progress:
        messages.error(request, 'Completion can only be requested while the project is in progress.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    body = request.POST.get('body', '').strip()[:5000]
    contract.status = Contract.Status.COMPLETION_REQUESTED
    contract.save(update_fields=['status', 'updated_at'])
    event = ContractEvent.objects.create(
        contract=contract,
        event_type=ContractEvent.EventType.COMPLETION_REQUESTED,
        actor=request.user,
        message=body,
    )
    captions = request.POST.getlist('image_captions')
    for msg in _save_images(ContractEventImage, 'event', event, request.FILES, captions):
        messages.warning(request, f'Image skipped: {msg}')
    messages.success(request, 'Completion requested. Waiting for the requester to confirm.')
    notify(
        contract.requester,
        Notification.NotifType.COMPLETION_REQUESTED,
        'Your artisan has marked the project as complete',
        body='Please review the work and confirm or send it back.',
        link=reverse('progress:contract_detail_view', kwargs={'contract_id': contract_id}),
    )
    return redirect('progress:contract_detail_view', contract_id=contract_id)


@login_required
@require_POST
def confirm_completion_view(request, contract_id):
    contract = get_object_or_404(Contract, id=contract_id)

    if request.user != contract.requester:
        messages.error(request, 'Only the requester can confirm completion.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    if not contract.is_completion_requested:
        messages.error(request, 'There is no pending completion request.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    contract.status = Contract.Status.COMPLETED
    contract.completed_at = timezone.now()
    contract.save(update_fields=['status', 'completed_at', 'updated_at'])
    ContractEvent.objects.create(
        contract=contract,
        event_type=ContractEvent.EventType.COMPLETED,
        actor=request.user,
    )
    messages.success(request, 'Project confirmed as complete. Thank you!')
    notify(
        contract.artisan,
        Notification.NotifType.COMPLETION_CONFIRMED,
        'Your project has been confirmed as complete',
        body='Congratulations! The requester has confirmed the work is done.',
        link=reverse('progress:contract_detail_view', kwargs={'contract_id': contract_id}),
    )
    # TODO Escrow: contract.completed_at is the trigger for payment release
    return redirect('progress:contract_detail_view', contract_id=contract_id)


@login_required
@require_POST
def reject_completion_view(request, contract_id):
    contract = get_object_or_404(Contract, id=contract_id)

    if request.user != contract.requester:
        messages.error(request, 'Only the requester can reject a completion request.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    if not contract.is_completion_requested:
        messages.error(request, 'There is no pending completion request.')
        return redirect('progress:contract_detail_view', contract_id=contract_id)

    body = request.POST.get('body', '').strip()[:1000]
    contract.status = Contract.Status.IN_PROGRESS
    contract.save(update_fields=['status', 'updated_at'])
    event = ContractEvent.objects.create(
        contract=contract,
        event_type=ContractEvent.EventType.COMPLETION_REJECTED,
        actor=request.user,
        message=body,
    )
    captions = request.POST.getlist('image_captions')
    for msg in _save_images(ContractEventImage, 'event', event, request.FILES, captions):
        messages.warning(request, f'Image skipped: {msg}')
    messages.success(request, 'Sent back. The project is back in progress.')
    notify(
        contract.artisan,
        Notification.NotifType.COMPLETION_REJECTED,
        'Completion request was sent back',
        body=body if body else 'The requester sent the project back for more work.',
        link=reverse('progress:contract_detail_view', kwargs={'contract_id': contract_id}),
    )
    return redirect('progress:contract_detail_view', contract_id=contract_id)
