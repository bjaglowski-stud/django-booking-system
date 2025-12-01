from django.contrib import admin
from django.urls import include, path
from reservations.views import IndexView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("reservations.urls")),
    path("", IndexView.as_view(), name="index"),
]
