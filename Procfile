release: cd booking_backend && python manage.py migrate && python manage.py collectstatic --noinput
web: cd booking_backend && gunicorn booking_system.wsgi:application --log-file -