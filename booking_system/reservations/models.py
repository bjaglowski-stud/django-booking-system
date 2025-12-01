import datetime

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class AppointmentSlot(models.Model):
    start = models.DateTimeField()
    duration_minutes = models.IntegerField(default=30)
    max_capacity = models.IntegerField(default=1)  # number of bookings allowed per slot

    class Meta:
        ordering = ["start"]

    def __str__(self):
        return f"{self.start.isoformat()} ({self.duration_minutes}m)"

    @property
    def end(self):
        return self.start + datetime.timedelta(minutes=self.duration_minutes)

    def clean(self):
        if self.duration_minutes <= 0:
            raise ValidationError("Duration must be positive")

    def available_capacity(self):
        return self.max_capacity - self.bookings.filter(status="confirmed").count()


class Booking(models.Model):
    STATUS_CHOICES = (
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    )
    slot = models.ForeignKey(AppointmentSlot, on_delete=models.CASCADE, related_name="bookings")
    first_name = models.CharField(max_length=64)
    last_name = models.CharField(max_length=64)
    email = models.EmailField()
    created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="confirmed")

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return f"Booking for {self.first_name} {self.last_name} @ {self.slot.start.isoformat()}"

    def clean(self):
        if self.slot.start < timezone.now():
            raise ValidationError("Cannot book slots in the past")
        if self.status == "confirmed" and self.slot.available_capacity() <= 0:
            raise ValidationError("Slot is full")
