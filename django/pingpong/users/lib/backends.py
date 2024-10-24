
from django.contrib.auth.backends import BaseBackend

from users.models import UserModel


class SettingsBackend(BaseBackend):
    def authenticate(self, request, user_id=None):
        user = None
        try:
            user = UserModel.objects.get(user_id=user_id)
        except UserModel.DoesNotExist:
            pass
        return user

    def get_user(self, user_id):
        user = None
        try:
            user = UserModel.objects.get(user_id=user_id)
        except UserModel.DoesNotExist:
            pass
        return user
