from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser


class CustomUserManager(BaseUserManager):
    def _create_user(self, user_id, role=None, **extra_fields):
        if extra_fields.get('is_admin') is True:
            role = self.get_role(id=1, role_name='admin')
        else:
            role = self.get_role(id=2, role_name='user')

        user = self.model(user_id=user_id, role=role, **extra_fields)
        user.save(using=self._db)
        return user

    def get_role(self, id: int, role_name: str):
        role, _ = UserRoleModel.objects.get_or_create(id=id, name=role_name)
        return role

    def create_user(self, user_id, **extra_fields):
        extra_fields.setdefault('is_admin', False)

        return self._create_user(user_id, **extra_fields)

    def create_superuser(self, user_id, **extra_fields):
        extra_fields.setdefault('is_admin', True)

        if extra_fields.get('is_admin') is not True:
            raise ValueError('Superuser must have is_admin=True.')

        return self._create_user(user_id, **extra_fields)


class UserRoleModel(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=10)

    class Meta:
        managed = True
        db_table = 'user_role'
        app_label = 'users'
        verbose_name_plural = '사용자 권한'

class UserModel(AbstractBaseUser):
    user_id = models.CharField(max_length=100, primary_key=True, unique=True, verbose_name='아이디')
    name = models.CharField(max_length=100, verbose_name='이름')
    email = models.EmailField(max_length=100, null=True, verbose_name='이메일')
    image = models.CharField(max_length=100, null=True, verbose_name='이미지')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='가입일자')
    last_login = models.DateTimeField(blank=True, null=True, verbose_name='최근 로그인 일자')
    is_active = models.BooleanField(default=True)
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)

    role = models.ForeignKey(
        UserRoleModel, 
        related_name='user', 
        db_column='role_id', 
        on_delete=models.PROTECT, 
        verbose_name='사용자 권한',
        null=True
    )
    
    objects = CustomUserManager()
    USERNAME_FIELD = 'user_id'
    password = None
    REQUIRED_FIELDS = []
    
    class Meta:
        managed = True
        db_table = 'users'
        app_label = 'users'
        verbose_name_plural = '회원정보'
