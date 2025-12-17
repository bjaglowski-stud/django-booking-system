# Booking System

Interactive Appointment Calendar for Medical Practices

## Goal
Create a dynamic calendar that allows users to easily view available dates and book appointments.

## Tech Stack

### Backend
- Django 6.x
- Django REST Framework
- MySQL 8.x
- JWT Authentication (djangorestframework-simplejwt)
- Docker & Docker Compose

### Frontend
- Angular 21 (standalone components)
- FullCalendar 6.x with Angular adapter
- Bootstrap 5.3
- TypeScript
- RxJS with Signals
- Reactive Forms

## Features

- **User Authentication**: JWT-based authentication with login, registration, and role-based access control
- **Appointment Management**: Doctors can create available time slots
- **Booking System**: Patients can book appointments with doctors
- **Calendar View**: Interactive FullCalendar showing available and booked slots
- **My Bookings**: Users can view and cancel their bookings
- **Admin Panel**: Administrators can view all bookings in the system
- **Real-time Notifications**: Toast notifications for success, error, and info messages
- **Responsive Design**: Mobile-friendly interface with Bootstrap

## Getting Started

### Using Docker (Recommended)

1. Clone the repository
```bash
git clone https://github.com/bjaglowski-stud/django-booking-system.git
cd django-booking-system
```

2. Create `.env` file with your MySQL details
```env
SECRET_KEY=replace-me
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_ADDRESS=booking_db
DATABASE_PORT=3306
DATATABE_USER=replace-me
DATABASE_PASSWORD=replace-me
DATABASE_NAME=booking_db
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
MYSQL_ROOT_PASSWORD=replace-me
```

3. Start the services
```bash
docker compose up -d
```

4. Initialize the database (first time only)
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

5. Access the application
- Frontend: http://localhost
- Backend API: http://localhost/api
- Admin Panel: http://localhost/admin

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Obtain JWT token (login)
- `POST /api/auth/register/` - Register new user
- `GET /api/auth/user/` - Get current user details

### Appointments
- `GET /api/appointments/` - List available appointment slots
  - Query params: `start`, `end` (ISO datetime)
- `POST /api/appointments/` - Create new appointment slot (doctors only)
- `GET /api/appointments/{id}/` - Get appointment details
- `DELETE /api/appointments/{id}/` - Delete appointment slot (doctors only)

### Bookings
- `GET /api/bookings/` - List all bookings (admin only)
- `POST /api/bookings/` - Create new booking
  - Request body: `{"appointment": slot_id, "reason": "description"}`
- `GET /api/bookings/my/` - Get current user's bookings
- `GET /api/bookings/slot/{slot_id}/` - Get bookings for specific slot
- `GET /api/bookings/{id}/` - Get booking details (owner or admin)
- `PUT /api/bookings/{id}/` - Update booking (owner or admin)
  - Request body: `{"reason": "updated description"}`
- `POST /api/bookings/{id}/cancel/` - Cancel booking (owner or admin)

### User Roles
- **Patient**: Can view slots and create/cancel own bookings
- **Doctor**: Can create appointment slots + patient permissions
- **Admin**: Full access to all bookings and user management

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After obtaining a token from `/api/auth/token/`, include it in the Authorization header:

```bash
Authorization: Bearer <access_token>
```

Example login request:
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```