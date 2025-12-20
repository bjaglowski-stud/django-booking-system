from __future__ import annotations

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class AppointmentSlot(models.Model):
    start = models.DateTimeField(db_index=True)
    # nullable doctor (user) assignment for clinic context
    doctor = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appointment_slots",
        limit_choices_to={"groups__name": "doctor"},
    )

    class Meta:
        ordering = ["start"]

    def __str__(self) -> str:
        return f"{self.start.isoformat()}"

    def is_booked(self) -> bool:
        """Check if slot has any confirmed booking."""
        return self.bookings.filter(status=Booking.Status.CONFIRMED).exists()


class Booking(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    slot = models.ForeignKey(AppointmentSlot, on_delete=models.CASCADE, related_name="bookings")
    # optional link to authenticated user
    user = models.ForeignKey(
        "auth.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="bookings",
    )
    # optional reason/notes for appointment
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["slot", "status"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self) -> str:
        owner = self.user.username if self.user else "Anonymous"
        return f"Booking for {owner} @ {self.slot.start.isoformat()}"

    def clean(self) -> None:
        if self.slot.start < timezone.now():
            raise ValidationError("Cannot book slots in the past")
        if self.status == self.Status.CONFIRMED and self.slot.is_booked():
            # Check if there's already a confirmed booking for this slot
            existing = self.slot.bookings.filter(status=self.Status.CONFIRMED).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError("Slot is already booked")
