from django.urls import path
from . import views

app_name = 'progress'

urlpatterns = [
    path('<int:contract_id>/',                   views.contract_detail_view,    name='contract_detail_view'),
    path('<int:contract_id>/update/',             views.post_update_view,        name='post_update_view'),
    path('comment/<int:update_id>/',              views.add_comment_view,        name='add_comment_view'),
    path('<int:contract_id>/request-completion/', views.request_completion_view, name='request_completion_view'),
    path('<int:contract_id>/confirm-completion/', views.confirm_completion_view, name='confirm_completion_view'),
    path('<int:contract_id>/reject-completion/',  views.reject_completion_view,  name='reject_completion_view'),
]
