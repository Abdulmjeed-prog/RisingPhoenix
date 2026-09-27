from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import api_views

app_name = 'account_api'

urlpatterns = [
    path('register/', api_views.register, name='register'),
    path('register/artisan/', api_views.register_artisan, name='register_artisan'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('me/', api_views.me, name='me'),
]