from typing import TYPE_CHECKING

from django.utils import timezone
from django.views.generic import TemplateView
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AppointmentSlot, Booking
from .permissions import (
    CanCreateBooking,
    IsAdministrator,
    IsBookingOwnerOrReadOnly,
    IsDoctor,
)
from .serializers import AppointmentSlotSerializer, BookingPublicSerializer, BookingSerializer, UserRegistrationSerializer

if TYPE_CHECKING:
    from django.db.models import QuerySet


class IndexView(TemplateView):
    template_name = "index.html"


class AppointmentSlotViewSet(viewsets.ModelViewSet):
    queryset = AppointmentSlot.objects.all()
    serializer_class = AppointmentSlotSerializer

    def get_queryset(self) -> QuerySet[AppointmentSlot]:
        # Only return future appointment slots
        qs = super().get_queryset()
        now = timezone.now()
        return qs.filter(start__gte=now).order_by("start")

    def get_permissions(self) -> list[permissions.BasePermission]:
        if self.action in ("create", "update", "partial_update", "destroy"):
            # allow administrators or doctors to manage slots
            return [IsDoctor() or IsAdministrator()]
        return [permissions.AllowAny()]


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related("slot", "slot__doctor", "user")
    serializer_class = BookingSerializer

    def get_permissions(self) -> list[permissions.BasePermission]:
        # only authenticated users can create bookings; listing by slot may be public; other actions require admin
        if self.action == "create":
            return [permissions.IsAuthenticated(), CanCreateBooking()]
        if self.action == "list":
            # allow public listing only when filtering by slot (limited data will be returned)
            if self.request and self.request.query_params.get("slot"):
                return [permissions.AllowAny()]
        if self.action in ("mine", "cancel"):
            return [permissions.IsAuthenticated()]
        if self.action == "all_bookings":
            # administrators can view all bookings
            return [permissions.IsAuthenticated(), IsAdministrator()]
        if self.action == "retrieve":
            # allow owners (or staff/admin) to retrieve their booking detail
            return [permissions.IsAuthenticated(), IsBookingOwnerOrReadOnly()]
        if self.action in ("update", "partial_update"):
            # allow owners, administrators to edit their booking (reason)
            return [permissions.IsAuthenticated(), IsBookingOwnerOrReadOnly()]
        return [IsAdministrator()]

    def get_serializer_class(self) -> type[BookingSerializer] | type[BookingPublicSerializer]:
        # when listing by slot, choose serializer based on requester:
        # - staff or authenticated user (owner) should see full booking fields for their own bookings
        # - anonymous/public should get the limited serializer
        if self.request and self.request.query_params.get("slot"):
            user = getattr(self.request, "user", None)
            if user and user.is_authenticated:
                # owners should get the full serializer (they'll only receive their own bookings by queryset)
                return BookingSerializer
            return BookingPublicSerializer
        return super().get_serializer_class()

    def get_queryset(self) -> QuerySet[Booking]:
        qs = super().get_queryset().select_related("slot", "slot__doctor", "user")
        # support filtering by slot
        if slot_id := self.request.query_params.get("slot"):
            qs = qs.filter(slot_id=slot_id, status=Booking.Status.CONFIRMED)
            # Privacy: if requester is staff, return all bookings for the slot.
            # If requester is an authenticated regular user, return only their own bookings for that slot.
            # Otherwise (anonymous), do not expose bookings for the slot.
            user = getattr(self.request, "user", None)
            if user and user.is_authenticated:
                # Administrators can see all bookings for a slot
                if user.groups.filter(name="administrator").exists():
                    return qs
                return qs.filter(user=user)
            return qs.none()
        return qs

    def perform_create(self, serializer: BookingSerializer) -> Booking:
        booking = serializer.save()
        # signals will handle email
        return booking

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request) -> Response:
        qs = Booking.objects.filter(user=request.user).select_related("slot")
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)

        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated, IsAdministrator])
    def all_bookings(self, request) -> Response:
        """Endpoint for administrators to view all bookings."""
        qs = Booking.objects.all().select_related("slot", "user")
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)

        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk: int | None = None) -> Response:
        booking = self.get_object()
        # Allow owner or administrators to cancel
        is_admin = request.user.groups.filter(name="administrator").exists()
        if booking.user != request.user and not is_admin:
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        booking.status = Booking.Status.CANCELLED
        booking.save()
        serializer = self.get_serializer(booking)

        return Response(serializer.data)


class RegisterView(APIView):
    """Public endpoint to register a new user and return JWT tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs) -> Response:
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


class CurrentUserView(APIView):
    """Return current authenticated user's details."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request) -> Response:
        user = request.user

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
        )
