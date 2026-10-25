from django.urls import path
from . import api_views

app_name = 'request_api'

urlpatterns = [
    path('', api_views.request_list_api, name='list'),
    path('new/', api_views.request_create_api, name='create'),                    # ← add
    path('suggested-artisans/', api_views.suggested_artisans_api, name='suggested_artisans'),
    path('<int:request_id>/', api_views.request_detail_api, name='detail'),
    path('<int:request_id>/edit/', api_views.request_update_api, name='update'),    # ← add
    path('<int:request_id>/invite/', api_views.invite_artisan_api, name='invite'),
    path('<int:request_id>/reopen/', api_views.reopen_request_api, name='reopen'),
]