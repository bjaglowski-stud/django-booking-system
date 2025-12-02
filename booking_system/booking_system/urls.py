from django.contrib import admin
from django.http import HttpResponseGone
from django.urls import include, path


def index_unavailable(request):
    return HttpResponseGone("Frontend is served by the nginx container. Please access the site through the web server.")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    # Root is handled by the external nginx container which serves the SPA.
    path("", index_unavailable, name="index"),
]
