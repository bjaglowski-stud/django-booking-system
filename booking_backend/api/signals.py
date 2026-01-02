from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.mail import send_mail
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver

from .models import Booking

if TYPE_CHECKING:
    from django.db.models import Model


def _get_booking_confirmation_email_content(user_name: str, slot_time: str, doctor_name: str | None, reason: str) -> str:
    return f"""Witaj {user_name},

Twoja wizyta została pomyślnie zarezerwowana.

Szczegóły:
Data i godzina: {slot_time}
Lekarz: {doctor_name if doctor_name else "Do ustalenia"}
Powód wizyty: {reason if reason else "Nie podano"}

Dziękujemy za skorzystanie z naszego systemu.

Pozdrawiamy,
System Rezerwacji
"""


def _get_booking_cancellation_email_content(user_name: str, slot_time: str, doctor_name: str | None) -> str:
    return f"""Witaj {user_name},

Twoja wizyta została anulowana.

Szczegóły anulowanej wizyty:
Data i godzina: {slot_time}
Lekarz: {doctor_name if doctor_name else "Do ustalenia"}

Jeśli chcesz umówić nową wizytę, zapraszamy do naszego systemu rezerwacji.

Pozdrawiamy,
System Rezerwacji
"""


def _get_doctor_notification_email_content(doctor_name: str, slot_time: str, user_name: str | None, instance: Booking) -> str:
    return f"""Witaj {doctor_name},

Masz nową rezerwację wizyty.

Szczegóły:
Data i godzina: {slot_time}
Pacjent: {user_name if user_name else "Nieznany"}
Powód wizyty: {instance.reason if instance.reason else "Nie podano"}

Zaloguj się do systemu aby zobaczyć pełne szczegóły.

Pozdrawiamy,
System Rezerwacji
"""


@receiver(post_save, sender=Booking)
def on_booking_saved(sender: type[Model], instance: Booking, created: bool, **kwargs) -> None:
    """Send email notifications when booking is created or updated."""

    # Get user details
    user_email = None
    user_name = None
    if instance.user:
        user_email = instance.user.email
        user_name = instance.user.get_full_name() or instance.user.username

    # Get doctor details
    doctor_email = None
    doctor_name = None
    if instance.slot.doctor:
        doctor_email = instance.slot.doctor.email
        doctor_name = instance.slot.doctor.get_full_name() or instance.slot.doctor.username

    # Format slot time
    slot_time = instance.slot.start.strftime("%Y-%m-%d %H:%M")

    # 1. Notify user about confirmation (new booking)
    if created and instance.status == Booking.Status.CONFIRMED and user_email:
        subject = "Potwierdzenie rezerwacji wizyty"
        body = _get_booking_confirmation_email_content(user_name, slot_time, doctor_name, instance.reason)
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user_email], fail_silently=True)

    # 2. Notify user about cancellation
    if not created and instance.status == Booking.Status.CANCELLED and user_email:
        subject = "Anulowanie rezerwacji wizyty"
        body = _get_booking_cancellation_email_content(user_name, slot_time, doctor_name)
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user_email], fail_silently=True)

    # 3. Notify doctor about new booking
    if created and instance.status == Booking.Status.CONFIRMED and doctor_email:
        subject = "Nowa rezerwacja wizyty"
        body = _get_doctor_notification_email_content(doctor_name, slot_time, user_name, instance)
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [doctor_email], fail_silently=True)


@receiver(post_migrate)
def ensure_doctor_group(sender: type[Model], **kwargs) -> None:
    """Ensure a 'doctor' group exists after migrations."""
    Group.objects.get_or_create(name="doctor")
