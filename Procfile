release: python booking_system/manage.py migrate
web: cd booking_system && gunicorn booking_system.wsgi:application --log-file -