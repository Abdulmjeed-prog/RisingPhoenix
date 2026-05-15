from django.urls import path

from . import views

app_name = 'notification'

urlpatterns = [
    path('', views.notification_list_view, name='notification_list_view'),
    path('api/', views.recent_api_view, name='recent_api_view'),
    path('api/mark-read/<int:notif_id>/', views.mark_read_view, name='mark_read_view'),
    path('api/mark-all-read/', views.mark_all_read_view, name='mark_all_read_view'),
]
