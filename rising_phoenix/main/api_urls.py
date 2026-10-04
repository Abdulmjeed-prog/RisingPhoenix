from django.urls import path
from . import api_views

app_name = 'main_api'

urlpatterns = [
    path('home/', api_views.home_api, name='home'),
    path('dashboard/', api_views.dashboard_api, name='dashboard'),   # ← add
    path('browse/', api_views.browse_api, name='browse'),
]