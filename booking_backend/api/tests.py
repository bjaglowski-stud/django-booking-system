import datetime

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import AppointmentSlot, Booking


class BookingModelTest(TestCase):
    def test_create_booking_marks_slot_booked(self):
        slot = AppointmentSlot.objects.create(
            start=timezone.now() + datetime.timedelta(days=1),
        )
        Booking.objects.create(slot=slot, first_name="John", last_name="Doe", email="john@example.com")
        self.assertTrue(slot.is_booked())


class BookingApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.slot = AppointmentSlot.objects.create(
            start=timezone.now() + datetime.timedelta(days=1),
        )

    def test_create_booking_success(self):
        res = self.client.post(
            "/api/bookings/",
            {
                "slot": self.slot.id,
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane@example.com",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_booking_full_block(self):
        Booking.objects.create(slot=self.slot, first_name="X", last_name="Y", email="a@b.com")
        res = self.client.post(
            "/api/bookings/",
            {
                "slot": self.slot.id,
                "first_name": "Jane2",
                "last_name": "Doe2",
                "email": "jo@example.com",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
