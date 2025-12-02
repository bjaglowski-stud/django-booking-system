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
    class Meta:
        model = Booking
        fields = ["id", "slot", "first_name", "last_name", "email", "phone", "reason", "created", "status"]
        read_only_fields = ["created", "status"]

    def validate(self, data):
        # check slot exists and capacity
        slot = data.get("slot")
        if slot.start < timezone.now():
            raise serializers.ValidationError("Cannot book a slot in the past")
        if slot.available_capacity() <= 0:
            raise serializers.ValidationError("Slot is full")
        # prevent duplicate booking by same email for same slot
        email = data.get("email")
        if email and Booking.objects.filter(slot=slot, email__iexact=email, status="confirmed").exists():
            raise serializers.ValidationError("You already have a confirmed booking for this slot")
        # minimal phone validation (optional)
        phone = data.get("phone")
        if phone and len(phone) < 6:
            raise serializers.ValidationError({"phone": "Enter a valid phone number"})
        return data

    def create(self, validated_data):
        # Use a transaction to avoid race conditions on slot capacity
        with transaction.atomic():
            slot = AppointmentSlot.objects.select_for_update().get(pk=validated_data["slot"].pk)
            if slot.available_capacity() <= 0:
                raise serializers.ValidationError("Slot is full")
            booking = Booking.objects.create(**validated_data)
            return booking


class BookingPublicSerializer(serializers.ModelSerializer):
    """Limited serializer for public listing of bookings for a slot."""

    class Meta:
        model = Booking
        fields = ["id", "first_name", "last_name", "created"]
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
