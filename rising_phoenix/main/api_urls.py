from django.urls import path
from . import api_views

app_name = 'main_api'

urlpatterns = [
    path('home/', api_views.home_api, name='home'),
]