from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from .models import Notification


@login_required
def notification_list_view(request):
    notifications = list(
        Notification.objects.filter(recipient=request.user).order_by('-created_at')[:50]
    )
    return render(request, 'notification/notification_list.html', {
        'notifications': notifications,
    })


@login_required
def recent_api_view(request):
    qs = list(
        Notification.objects.filter(recipient=request.user).order_by('-created_at')[:5]
    )
    unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    data = [
        {
            'id': n.id,
            'title': n.title,
            'body': n.body,
            'link': n.link,
            'icon_class': n.icon_class,
            'icon_color': n.icon_color,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        }
        for n in qs
    ]
    return JsonResponse({'count': unread_count, 'notifications': data})


@login_required
@require_POST
def mark_read_view(request, notif_id):
    Notification.objects.filter(id=notif_id, recipient=request.user).update(is_read=True)
    unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return JsonResponse({'count': unread_count})


@login_required
@require_POST
def mark_all_read_view(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return JsonResponse({'count': 0})
