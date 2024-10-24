from rest_framework import serializers
from .models import TwoFactorAuth, UserModel

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ['user_id', 'name', 'email', 'image']

class TwoFactorAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = TwoFactorAuth
        fields = ['is_verified']
        read_only_fields = ['is_verified']

class VerifyTokenSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    token = serializers.CharField(max_length=6, min_length=6)