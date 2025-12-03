from rest_framework import permissions


class IsDoctorOrAdmin(permissions.BasePermission):
    """Allow access if user is staff or in the 'doctor' group."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        return user.groups.filter(name="doctor").exists()


class IsBookingOwnerOrReadOnly(permissions.BasePermission):
    """Allow read to anyone, write only to booking owner or staff.

    Intended for use on Booking objects where owner is in `obj.user`.
    """

    def has_object_permission(self, request, view, obj):
        # safe methods allowed for any authenticated user (or the view may allow unauthenticated listing)
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # staff may edit
        if user.is_staff:
            return True
        # owner may edit
        return getattr(obj, "user", None) == user
