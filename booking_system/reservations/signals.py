from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Booking


@receiver(post_save, sender=Booking)
def on_booking_created(sender, instance, created, **kwargs):
    if created and instance.status == "confirmed":
        subject = "Booking confirmation"
        body = f"Hello {instance.first_name},\n\nYour booking for {instance.slot.start} has been confirmed.\n\nThanks."
        send_mail(subject, body, None, [instance.email])
