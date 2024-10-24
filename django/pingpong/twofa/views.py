from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from django.http import JsonResponse
from django.core.cache import cache
import pyotp
import json
import qrcode
import base64
from io import BytesIO
from .models import TwoFactorAuth

def generate_qr_code(data):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    secret = pyotp.random_base32()
    
    TwoFactorAuth.objects.update_or_create(
        user=request.user,
        defaults={'secret_key': secret, 'is_verified': False}
    )

    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=request.user.email, issuer_name="pingpong")
    qr_code_url = generate_qr_code(provisioning_uri)
    
    return Response({'qr_url': qr_code_url, 'secret': secret})

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def verify_2fa(request):
    try:
        data = json.loads(request.body)
        user_code = data.get('code')
        
        tfa = TwoFactorAuth.objects.get(user=request.user)
        totp = pyotp.TOTP(tfa.secret_key)
        
        if totp.verify(user_code):
            temp_token = pyotp.random_base32()
            cache.set(f'2fa_verified_{request.user.user_id}', temp_token, 300)  # 5분 동안 유효
            return JsonResponse({'success': True, 'temp_token': temp_token})
        else:
            return JsonResponse({'success': False, 'message': 'Invalid code'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
    except TwoFactorAuth.DoesNotExist:
        return JsonResponse({'success': False, 'message': '2FA not set up'}, status=400)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def check_2fa_status(request):
    try:
        tfa = TwoFactorAuth.objects.get(user=request.user)
        temp_token = request.META.get('HTTP_X_2FA_TOKEN')
        is_verified = cache.get(f'2fa_verified_{request.user.user_id}') == temp_token
        return JsonResponse({'is_enabled': tfa.is_verified, 'is_verified': is_verified})
    except TwoFactorAuth.DoesNotExist:
        return JsonResponse({'is_enabled': False, 'is_verified': False})