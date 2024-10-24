# Generated by Django 5.1 on 2024-09-02 16:45

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_alter_usermodel_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usermodel',
            name='role',
            field=models.ForeignKey(db_column='role_id', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='user', to='users.userrolemodel', verbose_name='사용자 권한'),
        ),
    ]
