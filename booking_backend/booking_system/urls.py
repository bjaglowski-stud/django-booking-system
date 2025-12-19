import os

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView


# View to serve Angular app
class AngularAppView(TemplateView):
    template_name = "index.html"

    def get_template_names(self):
        # Use Angular's index.html if exists, otherwise Django's
        angular_index = os.path.join(settings.BASE_DIR.parent.parent, "booking_frontend", "dist", "booking-frontend", "browser", "index.html")
        if os.path.exists(angular_index):
            return [angular_index]
        return ["index.html"]


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    # Catch-all pattern for Angular routes - must be last
    re_path(r"^.*$", AngularAppView.as_view(), name="angular_app"),
]
