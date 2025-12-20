import os
from datetime import timedelta
from pathlib import Path

import environ

# base dir
BASE_DIR = Path(__file__).resolve().parent.parent

# env
env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, "change-me"),
    ALLOWED_HOSTS=(str, "localhost,127.0.0.1"),
)
# read .env file
environ.Env.read_env(os.path.join(BASE_DIR, "..", ".env"))

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS").split(",")

# apps
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "booking_system.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "..", "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "booking_system.wsgi.application"

if os.getenv("JAWSDB_URL"):
    # Heroku - MySQL via JawsDB
    import urllib.parse

    url = urllib.parse.urlparse(os.getenv("JAWSDB_URL"))
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": url.path[1:],
            "USER": url.username,
            "PASSWORD": url.password,
            "HOST": url.hostname,
            "PORT": url.port or 3306,
        }
    }
else:
    # Local - MySQL
    DATABASE_ADDRESS = env("DATABASE_ADDRESS", default="127.0.0.1")
    DATABASE_PORT = env("DATABASE_PORT", default="3306")
    DATABASE_USER = env("DATABASE_USER", default="")
    DATABASE_PASSWORD = env("DATABASE_PASSWORD", default="")
    DATABASE_NAME = env("DATABASE_NAME", default="booking_db")
    if DATABASE_ADDRESS:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.mysql",
                "NAME": DATABASE_NAME,
                "USER": DATABASE_USER,
                "PASSWORD": DATABASE_PASSWORD,
                "HOST": DATABASE_ADDRESS,
                "PORT": DATABASE_PORT,
            }
        }
    else:
        # fallback to sqlite for development / tests
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            },
        }

# password validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "pl"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# static files
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Angular build directory
ANGULAR_BUILD_DIR = os.path.join(BASE_DIR.parent.parent, "booking_frontend", "dist", "booking-frontend", "browser")

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]

# Add Angular build directory if it exists
if os.path.exists(ANGULAR_BUILD_DIR):
    STATICFILES_DIRS.append(ANGULAR_BUILD_DIR)

# Default primary key
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
}

# CORS
CORS_ALLOW_ALL_ORIGINS = True

# Email settings
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=25)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="")

# Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",  # <- musi być INFO lub DEBUG
    },
}
