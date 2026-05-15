from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Notification(models.Model):
    class NotifType(models.TextChoices):
        PROPOSAL_RECEIVED    = 'proposal_received',    'New Proposal'
        PROPOSAL_ACCEPTED    = 'proposal_accepted',    'Proposal Accepted'
        PROPOSAL_REJECTED    = 'proposal_rejected',    'Proposal Rejected'
        PROGRESS_UPDATE      = 'progress_update',      'Progress Update'
        COMMENT_ADDED        = 'comment_added',        'New Feedback'
        COMPLETION_REQUESTED = 'completion_requested', 'Completion Requested'
        COMPLETION_CONFIRMED = 'completion_confirmed', 'Project Completed'
        COMPLETION_REJECTED  = 'completion_rejected',  'Completion Sent Back'
        MESSAGE_RECEIVED     = 'message_received',     'New Message'

    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notif_type = models.CharField(max_length=30, choices=NotifType.choices)
    title      = models.CharField(max_length=200)
    body       = models.CharField(max_length=500, blank=True)
    link       = models.CharField(max_length=500, blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient.username} — {self.get_notif_type_display()}'

    @property
    def icon_class(self):
        return {
            'proposal_received':    'bi-envelope-fill',
            'proposal_accepted':    'bi-check-circle-fill',
            'proposal_rejected':    'bi-x-circle-fill',
            'progress_update':      'bi-image',
            'comment_added':        'bi-chat-dots-fill',
            'completion_requested': 'bi-hourglass-split',
            'completion_confirmed': 'bi-trophy-fill',
            'completion_rejected':  'bi-arrow-counterclockwise',
            'message_received':     'bi-chat-fill',
        }.get(self.notif_type, 'bi-bell')

    @property
    def icon_color(self):
        return {
            'proposal_received':    '#1a6fa8',
            'proposal_accepted':    '#1a7a4a',
            'proposal_rejected':    '#8a7a6e',
            'progress_update':      '#c2724f',
            'comment_added':        '#c2724f',
            'completion_requested': '#b07c00',
            'completion_confirmed': '#1a7a4a',
            'completion_rejected':  '#b07c00',
            'message_received':     '#1a6fa8',
        }.get(self.notif_type, '#8a7a6e')
