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
    path('artisan-dashboard/', api_views.artisan_dashboard_api, name='artisan_dashboard'),
    path('profile/<str:username>/', api_views.profile_api, name='profile'),
    path('update-profile/<str:user_name>/', api_views.update_profile_view, name='update_profile'),
    path('send-phone-verification/<str:user_name>/', api_views.send_phone_verification, name='send_phone_verification'),
    path('verify-phone/<str:user_name>/', api_views.verify_phone, name='verify_phone'),
    path('password-reset/', api_views.password_reset_request, name='password_reset'),
    path('password-reset/verify/<str:uidb64>/<str:token>/', api_views.password_reset_verify, name='password_reset_verify'),
    path('password-reset/confirm/<str:uidb64>/<str:token>/', api_views.password_reset_confirm, name='password_reset_confirm'),
    path('stripe/connect/', api_views.stripe_connect, name='stripe_connect'),
    path('stripe/refresh/', api_views.stripe_connect_refresh, name='stripe_connect_refresh'),
    path('stripe/return/', api_views.stripe_connect_return, name='stripe_connect_return'),
    path('stripe/status/', api_views.stripe_status, name='stripe_status'),
    ]