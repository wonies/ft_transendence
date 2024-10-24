from django.urls import path
from .views import FourtyTwoCallbackView
from .views import FourtyTwoLoginView

urlpatterns = [
	path('login/', FourtyTwoLoginView.as_view()),
    path('login/callback/', FourtyTwoCallbackView.as_view()),
]