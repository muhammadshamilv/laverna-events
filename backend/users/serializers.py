from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)

from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for creating a new LavernaEvents user."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={"input_type": "password"},
    )

    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    # Optional at registration - defaults to ORGANIZER (the model field's
    # own default) when omitted, so every existing caller of this endpoint
    # keeps working unchanged. Deliberately restricted to ORGANIZER and
    # PHOTOGRAPHER only: ADMIN accounts are never self-service (created via
    # Django admin/createsuperuser only), and GUEST is not a login-capable
    # role in this app (guests interact only through their response_token
    # link, never through /auth/register/).
    role = serializers.ChoiceField(
        choices=[
            (User.Role.ORGANIZER, User.Role.ORGANIZER.label),
            (User.Role.PHOTOGRAPHER, User.Role.PHOTOGRAPHER.label),
        ],
        required=False,
        default=User.Role.ORGANIZER,
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "email",
            "mobile_number",
            "password",
            "password_confirm",
            "role",
        )

    def validate_full_name(self, value: str) -> str:
        """Validate and normalize the user's full name."""

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Full name is required."
            )

        return value

    def validate_email(self, value: str) -> str:
        """Validate and normalize email address."""

        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate_mobile_number(self, value: str) -> str:
        """Validate and normalize mobile number."""

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Mobile number is required."
            )

        if not value.isdigit():
            raise serializers.ValidationError(
                "Mobile number must contain only digits."
            )

        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Mobile number must contain between 10 and 15 digits."
            )

        if User.objects.filter(
            mobile_number=value
        ).exists():
            raise serializers.ValidationError(
                "A user with this mobile number already exists."
            )

        return value

    def validate_password(self, value: str) -> str:
        """Validate password using Django's password validators."""

        validate_password(value)

        return value

    def validate(self, attrs: dict) -> dict:
        """Validate password confirmation."""

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {
                    "password_confirm": (
                        "Passwords do not match."
                    )
                }
            )

        return attrs

    def create(self, validated_data: dict) -> User:
        """Create a user using the custom user manager."""

        validated_data.pop("password_confirm")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    """Serializer for mobile-number based JWT login."""

    username_field = "mobile_number"

    def validate(self, attrs: dict) -> dict:
        """Validate credentials and generate JWT tokens.

        Phase 14 (Admin Portal): a user suspended by an admin must be
        fully blocked from logging in, even with correct credentials.
        This check runs AFTER super().validate() succeeds (so password
        is already confirmed correct) but BEFORE any token data is
        attached to the response, matching the "fully blocked from
        login" decision for suspended accounts.
        """

        data = super().validate(attrs)

        user = self.user

        if user.is_suspended:
            raise AuthenticationFailed(
                "Your account has been suspended. Please contact support.",
                code="account_suspended",
            )

        data["user"] = {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "mobile_number": user.mobile_number,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
        }

        return data


class UserTokenRefreshSerializer(TokenRefreshSerializer):
    """Serializer for refreshing an access token."""

    pass


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for requesting a password reset link by email."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value: str) -> str:
        """Normalize the email. Existence is intentionally not revealed here."""

        return value.strip().lower()


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for confirming a password reset using uid + token."""

    uid = serializers.CharField(required=True)

    token = serializers.CharField(required=True)

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={"input_type": "password"},
    )

    new_password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    def validate_new_password(self, value: str) -> str:
        """Validate password strength using Django's password validators."""

        validate_password(value)

        return value

    def validate(self, attrs: dict) -> dict:
        """Validate uid/token pair and password confirmation."""

        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {
                    "new_password_confirm": (
                        "Passwords do not match."
                    )
                }
            )

        try:
            user_id = force_str(
                urlsafe_base64_decode(attrs["uid"])
            )
            user = User.objects.get(pk=user_id)

        except (
            User.DoesNotExist,
            ValueError,
            TypeError,
            OverflowError,
        ):
            raise serializers.ValidationError(
                {
                    "uid": (
                        "Invalid or expired reset link."
                    )
                }
            )

        token_generator = PasswordResetTokenGenerator()

        if not token_generator.check_token(
            user,
            attrs["token"],
        ):
            raise serializers.ValidationError(
                {
                    "token": (
                        "Invalid or expired reset link."
                    )
                }
            )

        attrs["user"] = user

        return attrs

    def save(self) -> User:
        """Set the new password on the resolved user."""

        user = self.validated_data["user"]

        user.set_password(
            self.validated_data["new_password"]
        )

        user.save(update_fields=["password"])

        return user


class VerifyMobileSerializer(serializers.Serializer):
    """Serializer for confirming a user's mobile number using an OTP code."""

    mobile_number = serializers.CharField(required=True)

    code = serializers.CharField(
        required=True,
        min_length=6,
        max_length=6,
    )

    def validate_mobile_number(self, value: str) -> str:
        """Normalize the mobile number."""

        return value.strip()


class ResendOTPSerializer(serializers.Serializer):
    """Serializer for requesting a new mobile verification OTP."""

    mobile_number = serializers.CharField(required=True)

    def validate_mobile_number(self, value: str) -> str:
        """Normalize the mobile number."""

        return value.strip()


class UserLogoutSerializer(serializers.Serializer):
    """Serializer for validating a refresh token during logout."""

    refresh = serializers.CharField(
        required=True,
        write_only=True,
    )