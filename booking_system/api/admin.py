from django.contrib import admin

from .models import AppointmentSlot, Booking


@admin.register(AppointmentSlot)
class AppointmentSlotAdmin(admin.ModelAdmin):
    list_display = ("start", "duration_minutes", "max_capacity")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "phone", "slot", "status", "created")
    list_filter = ("status", "slot")
    search_fields = ("first_name", "last_name", "email", "phone")
    readonly_fields = ("created",)
