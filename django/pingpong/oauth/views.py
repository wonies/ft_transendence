  
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import requests
from django.core.exceptions import ValidationError
from django.db import transaction
import jwt


from users.models import UserModel, UserRoleModel
from users.views import LoginView, UserView

from django.conf import settings
# from users.models import UserModel
# from users.views import LoginView, UserView

fourty_two_login_uri = "https://api.intra.42.fr/oauth/authorize"
fourty_two_token_uri = "https://api.intra.42.fr/oauth/token"
fourty_two_profile_uri = "https://api.intra.42.fr/v2/me"

class FourtyTwoLoginView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):
        
        print("Query params:", request.query_params)
        '''
        API code 요청

        ---
        '''

        request_data = {
            'client_id': settings.FOURTY_TWO_CLIENT_ID,
            'redirect_uri': settings.FOURTY_TWO_REDIRECT_URI,
        }
        return Response(request_data, status=200)




@method_decorator(csrf_exempt, name='dispatch')
class FourtyTwoCallbackView(APIView):
    permission_classes = [AllowAny]
    print("Received callback request")
    print("checking")
    
    def get(self, request):
        '''
        API access_token 및 user_info 요청
        ---
        '''
        data = request.query_params
        # access_token 발급 요청
        code = data.get('code')
        if not code:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        request_data = {
            'grant_type': 'authorization_code',
            'client_id': settings.FOURTY_TWO_CLIENT_ID,
            'redirect_uri': settings.FOURTY_TWO_REDIRECT_URI,
            'client_secret': settings.FOURTY_TWO_CLIENT_SECRET_KEY,
            'code': code,
        }
        token_res = requests.post(fourty_two_token_uri, data=request_data)
        token_json = token_res.json()
        access_token = token_json.get('access_token')
        if not access_token:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        access_token = f"Bearer {access_token}"  # 'Bearer ' 마지막 띄어쓰기 필수
        # 회원정보 요청
        auth_headers = {
            "Authorization": access_token,
        }
        user_info_res = requests.get(fourty_two_profile_uri, headers=auth_headers)
        user_info_json = user_info_res.json()
        user_id = user_info_json.get('id')
        user_data = {
            'user_id': user_id,
            'name': user_info_json.get('login'),
            'email': user_info_json.get('email'),
            'image': user_info_json.get('image').get("link"),
        }
        # 회원가입 및 로그인
        res = login_api(user_id=user_id, data=user_data)
        
        # Add CORS headers to the response
        res['Access-Control-Allow-Origin'] = '*'  # Or specify your frontend domain
        res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return res
    
def login_api(user_id: str, data: dict):
    '''
    회원가입 및 로그인
    '''
    login_view = LoginView()
    try:
        user = UserModel.objects.get(user_id=user_id)
        # 사용자가 이미 존재하면 정보 업데이트
        for field in ['name', 'email', 'image']:
            if data.get(field):
                setattr(user, field, data[field])
        user.save()
    except UserModel.DoesNotExist:
        # 사용자가 존재하지 않으면 새로 생성
        default_role = UserRoleModel.objects.get_or_create(id=2, defaults={'name': 'user'})[0]
        data['role'] = default_role
        user = UserModel.objects.create(**data)
    
    # LoginView.object 메서드에 사용자 객체 전달
    return login_view.object(user=user)