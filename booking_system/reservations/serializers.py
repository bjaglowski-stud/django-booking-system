from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import AppointmentSlot, Booking


class AppointmentSlotSerializer(serializers.ModelSerializer):
    available = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentSlot
        fields = ["id", "start", "duration_minutes", "max_capacity", "available"]

    def get_available(self, obj):
        return obj.available_capacity()


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "slot", "first_name", "last_name", "email", "created", "status"]
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
            if Booking.objects.filter(slot=slot, email__iexact=email, status="confirmed").exists():
                raise serializers.ValidationError("You already have a confirmed booking for this slot")
        return data

    def create(self, validated_data):
        # Use a transaction to avoid race conditions on slot capacity
        with transaction.atomic():
            slot = AppointmentSlot.objects.select_for_update().get(pk=validated_data["slot"].pk)
            if slot.available_capacity() <= 0:
                raise serializers.ValidationError("Slot is full")
            booking = Booking.objects.create(**validated_data)
            return booking
