from django.apps import AppConfig


class APIConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        # Import signals so they are registered when the app is ready
        try:
            from . import signals  # noqa: F401
        except Exception:
            # avoid breaking startup if signals cannot be imported during migrations
            pass
