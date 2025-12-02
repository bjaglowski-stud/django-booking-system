from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("reservations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Doctor",
            fields=[
                (
                    "id",
                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                ("name", models.CharField(max_length=128)),
                ("specialty", models.CharField(blank=True, max_length=128)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="appointmentslot",
            name="doctor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="slots",
                to="reservations.doctor",
            ),
        ),
        migrations.AddField(
            model_name="booking",
            name="phone",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="booking",
            name="reason",
            field=models.TextField(blank=True),
        ),
    ]
