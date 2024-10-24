from django.urls import path
from . import views

urlpatterns = [
    path('setup/', views.setup_2fa, name='setup_2fa'),
    path('verify/', views.verify_2fa, name='verify_2fa'),
    path('status/', views.check_2fa_status, name='check_2fa_status'),
]