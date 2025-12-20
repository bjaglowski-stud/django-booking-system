from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework import permissions

if TYPE_CHECKING:
    from django.contrib.auth.models import User
    from rest_framework.request import Request
    from rest_framework.views import APIView


class IsAuthenticatedBase(permissions.BasePermission):
    """Base class that checks if user is authenticated."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return self.check_permission(request, view, user)

    def check_permission(self, request: Request, view: APIView, user: User) -> bool:
        """Override this method in subclasses to add custom logic."""
        return True


class IsDoctor(IsAuthenticatedBase):
    """Allow access if user is in the 'doctor' group."""

    def check_permission(self, request: Request, view: APIView, user: User) -> bool:
        return user.groups.filter(name="doctor").exists()


class IsAdministrator(IsAuthenticatedBase):
    """Allow access if user is in the 'administrator' group."""

    def check_permission(self, request: Request, view: APIView, user: User) -> bool:
        return user.groups.filter(name="administrator").exists()


class CanCreateBooking(IsAuthenticatedBase):
    """Allow booking creation only for non-doctor authenticated users."""

    message = "Lekarze nie mogą rezerwować terminów dla siebie."

    def check_permission(self, request: Request, view: APIView, user: User) -> bool:
        # deny if user is in 'doctor' group
        return not user.groups.filter(name="doctor").exists()


class IsBookingOwnerOrReadOnly(permissions.BasePermission):
    """Allow read to anyone, write only to booking owner, administrator or staff.

    Intended for use on Booking objects where owner is in `obj.user`.
    """

    def has_object_permission(self, request, view, obj):
        # safe methods allowed for any authenticated user (or the view may allow unauthenticated listing)
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # administrators may edit
        if user.groups.filter(name="administrator").exists():
            return True
        # owner may edit
        return getattr(obj, "user", None) == user
