import datetime

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import AppointmentSlot

User = get_user_model()


class Command(BaseCommand):
    help = "Populate appointment slots for next N days"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=14)
        parser.add_argument("--start-hour", type=int, default=9)
        parser.add_argument("--end-hour", type=int, default=17)

    def handle(self, *args, **options):
        days = options["days"]
        start_hour = options["start_hour"]
        end_hour = options["end_hour"]
        now = timezone.now()
        added = 0
        # ensure 'doctor' group exists
        doctor_group, _ = Group.objects.get_or_create(name="doctor")

        # create two doctor users if they don't exist
        doctors_info = [
            {"username": "doctor1", "first_name": "Anna", "last_name": ""},
            {"username": "doctor2", "first_name": "Jan", "last_name": ""},
        ]
        doctor_users = []
        for info in doctors_info:
            user, created = User.objects.get_or_create(
                username=info["username"],
                defaults={
                    "email": f"{info['username']}@example.com",
                    "first_name": info["first_name"],
                    "last_name": info["last_name"],
                },
            )
            if created:
                # mark account without usable password (admin can set a real password later)
                user.set_unusable_password()
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user {user.username} (no password set)"))
            # assign to doctor group
            user.groups.add(doctor_group)
            user.save()
            doctor_users.append(user)

        rr = 0
        for day in range(days):
            day_date = (now + datetime.timedelta(days=day)).replace(hour=0, minute=0, second=0, microsecond=0)
            # Skip weekends
            if day_date.weekday() >= 5:
                continue
            for hour in range(start_hour, end_hour):
                start = day_date + datetime.timedelta(hours=hour)
                slot, created = AppointmentSlot.objects.get_or_create(start=start)
                # if slot has no doctor assigned, distribute round-robin between our two doctors
                if created or slot.doctor is None:
                    assign_doctor = doctor_users[rr % len(doctor_users)]
                    slot.doctor = assign_doctor
                    slot.save()
                    rr += 1
                added += 1
        self.stdout.write(self.style.SUCCESS(f"Added/ensured {added} slots"))
        # report distribution
        for user in doctor_users:
            count = AppointmentSlot.objects.filter(doctor=user).count()
            self.stdout.write(self.style.SUCCESS(f"Doctor {user.get_full_name() or user.username} has {count} assigned slots"))
