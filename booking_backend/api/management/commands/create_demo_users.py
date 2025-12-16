from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create demo users: 2 doctors, 2 administrators, and 2 regular users"

    def handle(self, *args, **options):
        # Ensure groups exist
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
        admin_group, _ = Group.objects.get_or_create(name="administrator")

        # Define users to create
        users_config = [
            {
                "username": "doctor1",
                "email": "doctor1@example.com",
                "first_name": "Anna",
                "last_name": "Kowalska",
                "group": doctor_group,
                "password": "Doctor1234",
            },
            {
                "username": "doctor2",
                "email": "doctor2@example.com",
                "first_name": "Jan",
                "last_name": "Nowak",
                "group": doctor_group,
                "password": "Doctor1234",
            },
            {
                "username": "admin1",
                "email": "admin1@example.com",
                "first_name": "Piotr",
                "last_name": "Wiśniewski",
                "group": admin_group,
                "password": "Admin1234",
            },
            {
                "username": "admin2",
                "email": "admin2@example.com",
                "first_name": "Maria",
                "last_name": "Wójcik",
                "group": admin_group,
                "password": "Admin1234",
            },
            {
                "username": "user1",
                "email": "user1@example.com",
                "first_name": "Tomasz",
                "last_name": "Kamiński",
                "group": None,
                "password": "User1234",
            },
            {
                "username": "user2",
                "email": "user2@example.com",
                "first_name": "Katarzyna",
                "last_name": "Lewandowska",
                "group": None,
                "password": "User1234",
            },
        ]

        for user_data in users_config:
            username = user_data["username"]
            group = user_data.pop("group")
            password = user_data.pop("password")

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": user_data["email"],
                    "first_name": user_data["first_name"],
                    "last_name": user_data["last_name"],
                },
            )

            if created:
                user.set_password(password)
                user.save()
                if group:
                    user.groups.add(group)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created user '{username}' ({user_data['first_name']} {user_data['last_name']})" + (f" in group '{group.name}'" if group else "")
                    )
                )
            else:
                # Update group if needed
                if group and not user.groups.filter(name=group.name).exists():
                    user.groups.add(group)
                    self.stdout.write(self.style.SUCCESS(f"User '{username}' already exists, added to group '{group.name}'"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"User '{username}' already exists"))

        self.stdout.write(self.style.SUCCESS("\nDemo users summary:"))
        self.stdout.write(self.style.SUCCESS("Doctors (doctor1, doctor2) - password: Doctor1234"))
        self.stdout.write(self.style.SUCCESS("Administrators (admin1, admin2) - password: Admin1234"))
        self.stdout.write(self.style.SUCCESS("Regular users (user1, user2) - password: User1234"))
