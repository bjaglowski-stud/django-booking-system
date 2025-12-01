import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone
from reservations.models import AppointmentSlot


class Command(BaseCommand):
    help = "Populate appointment slots for next N days"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=14)
        parser.add_argument("--start-hour", type=int, default=9)
        parser.add_argument("--end-hour", type=int, default=17)
        parser.add_argument("--duration", type=int, default=30)

    def handle(self, *args, **options):
        days = options["days"]
        start_hour = options["start_hour"]
        end_hour = options["end_hour"]
        duration = options["duration"]
        now = timezone.now()
        added = 0
        for day in range(days):
            day_date = (now + datetime.timedelta(days=day)).replace(hour=0, minute=0, second=0, microsecond=0)
            for hour in range(start_hour, end_hour):
                start = day_date + datetime.timedelta(hours=hour)
                AppointmentSlot.objects.get_or_create(start=start, duration_minutes=duration)
                added += 1
        self.stdout.write(self.style.SUCCESS(f"Added/ensured {added} slots"))
