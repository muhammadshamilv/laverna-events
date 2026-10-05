from rest_framework.permissions import BasePermission


class IsOrganizer(BasePermission):
    """Allows access only to authenticated users with the ORGANIZER role."""

    message = "This action is restricted to event organizers."

    def has_permission(self, request, view):
        """Check the request user is authenticated and has the ORGANIZER role."""

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ORGANIZER"
        )


class IsPhotographer(BasePermission):
    """Allows access only to authenticated users with the PHOTOGRAPHER role."""

    message = "This action is restricted to photographers."

    def has_permission(self, request, view):
        """Check the request user is authenticated and has the PHOTOGRAPHER role."""

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "PHOTOGRAPHER"
        )


class IsAdminRole(BasePermission):
    """Allows access only to authenticated users with the ADMIN role.

    This checks the User.role field, distinct from Django's is_staff/
    is_superuser used for the built-in /admin/ site.
    """

    message = "This action is restricted to administrators."

    def has_permission(self, request, view):
        """Check the request user is authenticated and has the ADMIN role."""

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsOwner(BasePermission):
    """Object-level permission: only allows access if the object belongs to the requester.

    Assumes the object has a field pointing back to the owning user.
    Set `owner_field` on the view (defaults to "user") to customize which
    field is checked, e.g. owner_field = "organizer".
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        """Check the object's owner field matches the requesting user."""

        owner_field = getattr(view, "owner_field", "user")

        owner = getattr(obj, owner_field, None)

        return owner == request.user
