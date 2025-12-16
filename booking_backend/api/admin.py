from django.contrib import admin

from .models import AppointmentSlot, Booking


@admin.register(AppointmentSlot)
class AppointmentSlotAdmin(admin.ModelAdmin):
    list_display = ("start", "doctor")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("user", "slot", "status", "reason")
    list_filter = ("status", "slot")
    search_fields = ("user__username", "user__email", "reason")
