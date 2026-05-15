from django import forms


class ProgressCommentForm(forms.Form):
    body = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'progress-textarea progress-textarea--comment',
            'placeholder': 'Leave feedback or ask a question...',
            'rows': 3,
        }),
        max_length=1000,
    )
