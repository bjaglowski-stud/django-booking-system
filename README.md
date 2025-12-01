# Django Booking System

Interaktywny Kalendarz Rezerwacji na Stronie Internetowej

## Cel
Stworzenie dynamicznego kalendarza, który umożliwi użytkownikom łatwe przeglądanie dostępnych terminów oraz rezerwację wizyt lub wydarzeń.

## Tech stack
- Django 5.x
- Django REST Framework
- MySQL
- Heroku / AWS / GCP for deployment
- FullCalendar (frontend)

## Getting started
1. Create a virtualenv and install dependencies (prefer `uv` venv manager)
```
# Install uv (optional, system-wide or user install):
pip install uv

# Create a venv using uv (example, `uv` commands vary by system):
# *Note: replace `python3.13` with your local interpreter version*
uv create --python=python3.13 .venv
uv activate .venv

# Install runtime dependencies from pyproject.toml
pip install -e .

# For development dependencies (ruff, pytest etc.):
pip install -e .[dev]
```
2. Create `.env` file from `.env.example` and set your MySQL details
3. Run migrations and create a superuser
```
python manage.py migrate
python manage.py createsuperuser
```
4. Start the server
```
python manage.py runserver
```

## API
- `/api/appointments/` - GET available appointment slots
- `/api/bookings/` - POST a new booking
- `/api/bookings/{id}/` - GET/PUT/DELETE a booking (admin protected)

## Authentication

Obtain a token (JWT) using `/api/auth/token/` with admin username and password. Use the returned `access` token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Deployment
See `deploy.md` for instructions for Heroku, AWS, and GCP.

## Scalability

- Use connection pooling and a managed MySQL instance (RDS, Cloud SQL) to handle more load.
- Run the Django app behind a WSGI server (gunicorn) and autoscale horizontally using load balancing.
- Use Redis for caching frequently-requested endpoints (slots list) and for Celery broker to offload tasks like sending email.
- Use a job queue (Celery or Cloud Tasks) to send notifications and handle background tasks.

## Next steps & Ideas

- Add a React or Vue frontend with better user experience, form validation and calendar UI.
- Improve concurrency handling using DB locks or reservations table with per-slot counters.
- Add Celery + Redis for background tasks (emails, analytics) and to process long-running tasks.
- Add rate-limiting and anti-spam measures for public booking endpoints.

## Developer tools

Linting & formatting (ruff):

Install `ruff` as a dev dependency and then run:

```
ruff check .
ruff format .
```

Using `uv` as a venv manager:

Install `uv` and create a venv (example):

```
pip install uv
uv create --python=python3.11 .venv
uv activate .venv
```

Then install dependencies and dev extras:

```
pip install -e .
pip install -e .[dev]
```