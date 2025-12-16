from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import AppointmentSlotViewSet, BookingViewSet, CurrentUserView, RegisterView

router = DefaultRouter()
router.register(r"appointments", AppointmentSlotViewSet, basename="appointments")
router.register(r"bookings", BookingViewSet, basename="bookings")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/me/", CurrentUserView.as_view(), name="current_user"),
]
