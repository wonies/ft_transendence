from django.db import models
from django.conf import settings

class TwoFactorAuth(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, to_field='user_id')
    secret_key = models.CharField(max_length=32)
    is_verified = models.BooleanField(default=False)