import logging

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from datetime import datetime
import pytz

from .serializers import *
from django.conf import settings
from .lib.permission import LoginRequired

logger = logging.getLogger(__name__)


class UserView(APIView):
		permission_classes = [AllowAny]

		'''
		계정 정보
		'''
		def get(self, request):
			'''
			로그인한 계정 정보 조회

			---
			사용자 계정 ID, 이메일, 가입일자, 최근 로그인 일자 조회
			'''
			serializer = UserInfoSerializer(request.user)
			response_data = serializer.data

			return Response(data=response_data, status=status.HTTP_200_OK)


		def delete(self, request, *args, **kwargs):
			'''
			계정 삭제

			---
			'''
			request.user.delete()

			return Response(status=status.HTTP_204_NO_CONTENT)

		def get_or_create_user(self, data: dict):
			serializer = CreateUserSerializer(data=data)

			if not serializer.is_valid():
					return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

			user = serializer.validated_data
			serializer.create(validated_data=user)

			return Response(data=user, status=status.HTTP_201_CREATED)

		def post(self, request):
			'''
			계정 조회 및 등록

			---
			'''
			return self.get_or_create_user(data=request.data)



class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Access Token 재발급
        """
        serializer = RefreshTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(data=serializer.errors, status=status.HTTP_401_BAD_REQUEST)
        token = serializer.validated_data
        return Response(data=token, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def object(self, user: UserModel):
   
        refresh = RefreshToken.for_user(user)
        
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        access_token_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
        expires_in = int(access_token_lifetime.total_seconds())

        logger.info(f"Access token generated: {access_token[:10]}...")
        logger.info(f"Refresh token generated: {refresh_token[:10]}...")
        logger.info(f"Token expires in: {expires_in} seconds")

        
        return Response({
            'user': UserInfoSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'expires_in': expires_in  # Add this line
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        '''
        로그인
        ---
        '''
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(user_id=serializer.validated_data['user_id'])
            if user:
                return self.object(user=user)
       
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [LoginRequired]

    def post(self, request):
        '''
        로그아웃

        ---
        '''
        serializer = LogoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.validated_data.blacklist()

        return Response(status=status.HTTP_200_OK)
