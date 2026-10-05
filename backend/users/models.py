# backend/users/models.py
import random

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model for LavernaEvents."""

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        ORGANIZER = "ORGANIZER", "Organizer"
        PHOTOGRAPHER = "PHOTOGRAPHER", "Photographer"
        GUEST = "GUEST", "Guest"

    full_name = models.CharField(
        max_length=150,
    )

    email = models.EmailField(
        unique=True,
        db_index=True,
    )

    mobile_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
    )

    profile_image = models.ImageField(
        upload_to="users/profile/",
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["jpg", "jpeg", "png"]
            )
        ],
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ORGANIZER,
    )

    is_verified = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    is_staff = models.BooleanField(
        default=False,
    )

    # Phase 14 (Admin Portal) - set by an admin via the User Management
    # "Suspend" action. Checked in UserLoginSerializer.validate() to fully
    # block login (separate from is_active, which Django's own auth system
    # also uses -- keeping a distinct flag means "admin suspended this
    # account" is never confused with any other is_active-driven behavior
    # elsewhere in the codebase).
    is_suspended = models.BooleanField(
        default=False,
        help_text="Set by an admin to block this user from logging in.",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    objects = UserManager()

    USERNAME_FIELD = "mobile_number"

    REQUIRED_FIELDS = [
        "email",
        "full_name",
    ]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.mobile_number})"


class MobileOTP(models.Model):
    """A one-time password sent to a user's mobile number for verification purposes."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="mobile_otps",
    )

    code = models.CharField(
        max_length=6,
    )

    is_used = models.BooleanField(
        default=False,
    )

    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "mobile_otps"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"OTP for {self.user.mobile_number}"

    @staticmethod
    def generate_code() -> str:
        """Generate a random 6-digit numeric code."""

        return f"{random.randint(0, 999999):06d}"

    @classmethod
    def create_for_user(cls, user: User, validity_minutes: int = 10) -> "MobileOTP":
        """Create a new OTP for the user, invalidating any previous unused OTPs."""

        cls.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True)

        return cls.objects.create(
            user=user,
            code=cls.generate_code(),
            expires_at=timezone.now() + timezone.timedelta(
                minutes=validity_minutes
            ),
        )

    def is_valid(self) -> bool:
        """Check whether this OTP is still usable."""

        return not self.is_used and timezone.now() <= self.expires_at
