from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import AppointmentSlot, Booking


class AppointmentSlotSerializer(serializers.ModelSerializer):
    doctor = serializers.SerializerMethodField()
    is_booked = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentSlot
        fields = ("id", "start", "doctor", "is_booked")

    def get_is_booked(self, obj):
        return obj.is_booked()

    def get_doctor(self, obj):
        if obj.doctor:
            return obj.doctor.get_full_name() or obj.doctor.username

        return None


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    slot_details = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ("id", "slot", "user", "reason", "status", "is_owner", "slot_details")
        read_only_fields = ("status", "user")

    def get_slot_details(self, obj):
        if obj.slot:
            return {"id": obj.slot.id, "start": obj.slot.start.isoformat(), "doctor_name": obj.slot.doctor.get_full_name() if obj.slot.doctor else None}
        return None

    def get_user(self, obj):
        if not (user_obj := obj.user):
            return None
        request = self.context.get("request")
        # For administrators, return detailed user info
        if request and hasattr(request, "user"):
            if request.user.groups.filter(name="administrator").exists():
                return {"id": user_obj.id, "username": user_obj.username, "full_name": user_obj.get_full_name() or user_obj.username}
        # For regular users, just return username

        return str(user_obj)

    def get_is_owner(self, obj):
        if not (request := self.context.get("request")):
            return False
        user = getattr(request, "user", None)

        return user and user.is_authenticated and obj.user == user

    def validate(self, data):
        # check slot exists and availability (only if slot is being updated)
        slot = data.get("slot")
        if slot is not None:
            if slot.start < timezone.now():
                raise serializers.ValidationError("Cannot book a slot in the past")
            if slot.is_booked():
                raise serializers.ValidationError("Slot is already booked")

            request = self.context.get("request")
            user = getattr(request, "user", None) if request is not None else None

            # prevent duplicate booking: check by authenticated user
            if user and user.is_authenticated:
                if Booking.objects.filter(slot=slot, user=user, status="confirmed").exists():
                    raise serializers.ValidationError("You already have a confirmed booking for this slot")
            else:
                # booking without authentication is not allowed by the viewset; keep validation minimal
                pass

        return data

    def create(self, validated_data):
        # Use a transaction to avoid race conditions on slot availability
        with transaction.atomic():
            slot = AppointmentSlot.objects.select_for_update().get(pk=validated_data["slot"].pk)
            if slot.is_booked():
                raise serializers.ValidationError("Slot is already booked")
            # If request user available in context, associate booking
            request = self.context.get("request")
            user = getattr(request, "user", None) if request is not None else None
            if user and user.is_authenticated:
                # associate booking with the authenticated user
                validated_data["user"] = user
            booking = Booking.objects.create(**validated_data)

            return booking


class BookingPublicSerializer(serializers.ModelSerializer):
    """Limited serializer for public listing of bookings for a slot."""

    class Meta:
        model = Booking
        fields = ("id",)
        read_only_fields = ()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = get_user_model()
        fields = ("username", "email", "password", "first_name", "last_name")

    def validate_password(self, value):
        validate_password(value)

        return value

    def create(self, validated_data):
        User = get_user_model()
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        return user
