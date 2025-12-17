from django.contrib.auth.models import Group
from django.core.mail import send_mail
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver

from .models import Booking


@receiver(post_save, sender=Booking)
def on_booking_created(sender, instance, created, **kwargs):
    if created and instance.status == "confirmed":
        subject = "Booking confirmation"
        # Prefer sending to the user's email if available
        recipient = None
        name = None
        if instance.user:
            recipient = getattr(instance.user, "email", None)
            name = getattr(instance.user, "get_full_name", lambda: None)() or instance.user.username
        else:
            # No user attached — skip sending if no email
            recipient = None
        if recipient:
            body = f"Hello {name},\n\nYour booking for {instance.slot.start} has been confirmed.\n\nThanks."
            send_mail(subject, body, None, [recipient])

    # Ensure a 'doctor' group exists after migrations so administrators can assign doctor role
    @receiver(post_migrate)
    def ensure_doctor_group(sender, **kwargs):
        Group.objects.get_or_create(name="doctor")
