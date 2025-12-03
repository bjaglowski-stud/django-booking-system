from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import AppointmentSlot, Booking


class AppointmentSlotSerializer(serializers.ModelSerializer):
    available = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentSlot
        fields = ["id", "start", "duration_minutes", "max_capacity", "available", "doctor"]

    def get_available(self, obj):
        return obj.available_capacity()

    def get_doctor(self, obj):
        return obj.doctor.name if obj.doctor else None


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Booking
        fields = ["id", "slot", "user", "reason", "created", "status"]
        read_only_fields = ["created", "status", "user"]

    def validate(self, data):
        # check slot exists and capacity
        slot = data.get("slot")
        if slot.start < timezone.now():
            raise serializers.ValidationError("Cannot book a slot in the past")
        if slot.available_capacity() <= 0:
            raise serializers.ValidationError("Slot is full")

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
        # Use a transaction to avoid race conditions on slot capacity
        with transaction.atomic():
            slot = AppointmentSlot.objects.select_for_update().get(pk=validated_data["slot"].pk)
            if slot.available_capacity() <= 0:
                raise serializers.ValidationError("Slot is full")
            # If request user available in context, associate and fill missing personal info
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
        fields = ["id", "created"]
        read_only_fields = ["created"]


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
