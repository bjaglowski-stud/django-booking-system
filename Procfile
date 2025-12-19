release: python booking_backend/manage.py migrate && python booking_backend/manage.py collectstatic --noinput
web: cd booking_backend && gunicorn booking_system.wsgi:application --log-file -