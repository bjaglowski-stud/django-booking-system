import logging
from datetime import datetime

from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.views.generic import TemplateView
from rest_framework import permissions, status, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AppointmentSlot, Booking
from .serializers import AppointmentSlotSerializer, BookingSerializer


class IndexView(TemplateView):
    template_name = "index.html"


class AppointmentSlotViewSet(viewsets.ModelViewSet):
    queryset = AppointmentSlot.objects.all()
    serializer_class = AppointmentSlotSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):  # noqa: C901
        qs = super().get_queryset()
        now = timezone.now()
        qs = qs.filter(start__gte=now)
        # optional query params: start, end
        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        if start:
            # normalize '+', which may become ' ' if url decoded incorrectly
            start = start.replace(" ", "+")
            dt_start = parse_datetime(start)
            if dt_start is None:
                # try date-only parse
                try:
                    d = parse_date(start)
                    if d:
                        dt_start = datetime(d.year, d.month, d.day)
                except Exception:
                    logging.exception("Failed to parse 'start' query param: %s", start)
            if dt_start:
                qs = qs.filter(start__gte=dt_start)
        if end:
            end = end.replace(" ", "+")
            dt_end = parse_datetime(end)
            if dt_end is None:
                try:
                    d = parse_date(end)
                    if d:
                        dt_end = datetime(d.year, d.month, d.day)
                except Exception:
                    logging.exception("Failed to parse 'end' query param: %s", end)
            if dt_end:
                qs = qs.filter(start__lte=dt_end)
        return qs


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related("slot")
    serializer_class = BookingSerializer

    def get_permissions(self):
        # anyone can create bookings; listing by slot may be public; other actions require admin
        if self.action == "create":
            return [permissions.AllowAny()]
        if self.action == "list":
            # allow public listing only when filtering by slot (limited data will be returned)
            if self.request and self.request.query_params.get("slot"):
                return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        # support filtering by slot, email
        slot_id = self.request.query_params.get("slot")
        email = self.request.query_params.get("email")
        if slot_id:
            qs = qs.filter(slot_id=slot_id)
        if email:
            qs = qs.filter(email__iexact=email)
        return qs

    def perform_create(self, serializer):
        booking = serializer.save()
        # signals will handle email
        return booking


class RegisterView(APIView):
    """Public endpoint to register a new user and return JWT tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from .serializers import UserRegistrationSerializer

        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # create token pair for the new user
        token_serializer = TokenObtainPairSerializer(
            data={
                "username": user.username,
                "password": request.data.get("password"),
            }
        )
        token_serializer.is_valid(raise_exception=True)
        return Response(token_serializer.validated_data, status=status.HTTP_201_CREATED)
