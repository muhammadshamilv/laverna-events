from .models import MobileOTP, User


def send_verification_otp(user: User) -> MobileOTP:
    """Generate an OTP and 'send' it via SMS to the user's mobile number.

    No real SMS gateway is configured yet. In development, the code is
    printed to the console/terminal (visible in the `runserver` output)
    instead of being sent through an actual SMS provider. Replace the
    print() call below with a real gateway integration (e.g. MSG91,
    Twilio) when one is available -- everything else in the OTP flow
    stays the same.
    """

    otp = MobileOTP.create_for_user(user)

    print(
        "\n"
        "==================== SMS OTP (DEV MODE) ====================\n"
        f"To: {user.mobile_number}\n"
        f"Message: Your LavernaEvents verification code is {otp.code}. "
        "It expires in 10 minutes.\n"
        "=============================================================\n"
    )

    return otp


def verify_otp_code(mobile_number: str, code: str) -> tuple[bool, str]:
    """Validate an OTP code for the given mobile number.

    Returns a tuple of (success, message). On success, marks the user
    as verified and the OTP as used.
    """

    user = User.objects.filter(mobile_number=mobile_number).first()

    if user is None:
        return False, "No account found with this mobile number."

    if user.is_verified:
        return False, "This account is already verified."

    otp = (
        MobileOTP.objects.filter(
            user=user,
            code=code,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if otp is None:
        return False, "Invalid verification code."

    if not otp.is_valid():
        return False, "This verification code has expired."

    otp.is_used = True
    otp.save(update_fields=["is_used"])

    user.is_verified = True
    user.save(update_fields=["is_verified"])

    return True, "Mobile number verified successfully."
