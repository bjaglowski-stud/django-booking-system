from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class AppointmentSlot(models.Model):
    start = models.DateTimeField()
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

    def __str__(self):
        return f"{self.start.isoformat()}"

    def is_booked(self):
        """Check if slot has any confirmed booking."""
        return self.bookings.filter(status="confirmed").exists()


class Booking(models.Model):
    STATUS_CHOICES = (
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    )
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="confirmed")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        owner = self.user.username if self.user else "Anonymous"
        return f"Booking for {owner} @ {self.slot.start.isoformat()}"

    def clean(self):
        if self.slot.start < timezone.now():
            raise ValidationError("Cannot book slots in the past")
        if self.status == "confirmed" and self.slot.is_booked():
            # Check if there's already a confirmed booking for this slot
            existing = self.slot.bookings.filter(status="confirmed").exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError("Slot is already booked")
