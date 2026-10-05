from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """Manager for the custom User model."""

    def create_user(
        self,
        mobile_number: str,
        email: str,
        full_name: str,
        password: str | None = None,
        **extra_fields,
    ):
        """Create and return a normal user."""

        if not mobile_number:
            raise ValueError("Mobile number is required.")

        if not email:
            raise ValueError("Email is required.")

        if not full_name:
            raise ValueError("Full name is required.")

        email = self.normalize_email(email)

        user = self.model(
            mobile_number=mobile_number,
            email=email,
            full_name=full_name,
            **extra_fields,
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        mobile_number: str,
        email: str,
        full_name: str,
        password: str,
        **extra_fields,
    ):
        """Create and return a superuser."""

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("role", "ADMIN")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(
            mobile_number=mobile_number,
            email=email,
            full_name=full_name,
            password=password,
            **extra_fields,
        )
