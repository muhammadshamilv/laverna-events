import csv
import io

from django.db import IntegrityError, transaction
from memberships.utils import LimitExceededError, check_guest_limit

from .models import Guest, GuestCategory


class GuestError(Exception):
    """Raised when a guest action cannot be completed."""

    def __init__(self, message: str, code: str = "guest_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def get_event_guest_count(event) -> int:
    """Return the number of guests currently on this event."""

    return Guest.objects.filter(event=event).count()


def create_guest(event, organizer, validated_data: dict) -> Guest:
    """Create a single guest on an event, enforcing the organizer's plan guest limit.

    Raises GuestError if the plan limit would be exceeded or the mobile
    number is already on this event's guest list.
    """

    current_count = get_event_guest_count(event)

    try:
        check_guest_limit(organizer, current_count)

    except LimitExceededError as error:
        raise GuestError(error.message, code=error.code)

    try:
        guest = Guest.objects.create(event=event, **validated_data)

    except IntegrityError:
        raise GuestError(
            "This mobile number is already on the guest list for this event.",
            code="duplicate_guest",
        )

    return guest


def update_guest(guest: Guest, validated_data: dict) -> Guest:
    """Apply partial updates to an existing guest."""

    try:
        for field, value in validated_data.items():
            setattr(guest, field, value)

        guest.save()

    except IntegrityError:
        raise GuestError(
            "This mobile number is already on the guest list for this event.",
            code="duplicate_guest",
        )

    return guest


def delete_guest(guest: Guest) -> None:
    """Permanently delete a guest."""

    guest.delete()


REQUIRED_CSV_COLUMNS = {"name", "mobile_number"}


def import_guests_from_csv(event, organizer, csv_file, category: GuestCategory | None = None) -> dict:
    """Import guests from an uploaded CSV file.

    Expected columns: name, mobile_number, email (optional),
    family_member_count (optional). Returns a summary dict of
    created/skipped rows with reasons. Stops importing (but keeps prior
    successful rows) once the plan's guest limit is reached.

    Phase 15: accepts an optional `category` - when given, every guest
    created by this import is assigned to it (e.g. "import this CSV as
    my Family list"). Guests stay uncategorized (category=None) when
    omitted, same as before this field existed.
    """

    try:
        decoded = csv_file.read().decode("utf-8-sig")

    except UnicodeDecodeError:
        raise GuestError(
            "Could not read the CSV file. Please ensure it is UTF-8 encoded.",
            code="invalid_encoding",
        )

    reader = csv.DictReader(io.StringIO(decoded))

    if reader.fieldnames is None or not REQUIRED_CSV_COLUMNS.issubset(
        {field.strip().lower() for field in reader.fieldnames}
    ):
        raise GuestError(
            "CSV must contain at least 'name' and 'mobile_number' columns.",
            code="invalid_columns",
        )

    created = []
    skipped = []

    current_count = get_event_guest_count(event)

    for row_number, row in enumerate(reader, start=2):
        name = (row.get("name") or "").strip()
        mobile_number = (row.get("mobile_number") or "").strip()
        email = (row.get("email") or "").strip().lower()
        family_raw = (row.get("family_member_count") or "").strip()

        if not name or not mobile_number:
            skipped.append(
                {"row": row_number, "reason": "Missing name or mobile_number."}
            )
            continue

        try:
            check_guest_limit(organizer, current_count)

        except LimitExceededError as error:
            skipped.append(
                {"row": row_number, "reason": error.message}
            )
            break

        family_member_count = 3

        if family_raw:
            try:
                family_member_count = int(family_raw)

            except ValueError:
                skipped.append(
                    {
                        "row": row_number,
                        "reason": "family_member_count must be a whole number.",
                    }
                )
                continue

        try:
            guest = Guest.objects.create(
                event=event,
                category=category,
                name=name,
                mobile_number=mobile_number,
                email=email,
                family_member_count=family_member_count,
            )

        except IntegrityError:
            skipped.append(
                {
                    "row": row_number,
                    "reason": "Duplicate mobile number for this event.",
                }
            )
            continue

        created.append(guest)
        current_count += 1

    return {
        "created_count": len(created),
        "skipped_count": len(skipped),
        "skipped_rows": skipped,
    }


def export_guests_to_csv(event) -> str:
    """Return a CSV string of all guests on the given event."""

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow(
        [
            "name",
            "mobile_number",
            "email",
            "category",
            "family_member_count",
            "invitation_status",
            "response_status",
        ]
    )

    for guest in Guest.objects.filter(event=event).select_related("category").order_by("name"):
        writer.writerow(
            [
                guest.name,
                guest.mobile_number,
                guest.email,
                guest.category.name if guest.category else "",
                guest.family_member_count,
                guest.invitation_status,
                guest.response_status,
            ]
        )

    return output.getvalue()


# --------------------------------------------------
# Guest Categories (Phase 15)
# --------------------------------------------------

DEFAULT_GUEST_CATEGORIES = ["Family", "Friends", "Relatives", "Special Guest", "VIP"]


def seed_default_categories(event) -> list[GuestCategory]:
    """Create the platform's default guest categories for a newly created event.

    Called once, right after Event creation. Idempotent: skips any name
    that already exists for this event, so it's safe to call more than
    once without creating duplicates.
    """

    existing_names = set(
        GuestCategory.objects.filter(event=event).values_list("name", flat=True)
    )

    to_create = [
        GuestCategory(event=event, name=name, display_order=index)
        for index, name in enumerate(DEFAULT_GUEST_CATEGORIES)
        if name not in existing_names
    ]

    if to_create:
        GuestCategory.objects.bulk_create(to_create)

    return list(GuestCategory.objects.filter(event=event).order_by("display_order"))


def create_category(event, validated_data: dict) -> GuestCategory:
    """Create a new, organizer-defined guest category on an event.

    Raises GuestError if a category with this name already exists on
    the event (the model's own UniqueConstraint backs this, caught here
    to return the project's standard error shape instead of a raw 500).
    """

    try:
        return GuestCategory.objects.create(event=event, **validated_data)

    except IntegrityError:
        raise GuestError(
            "A category with this name already exists for this event.",
            code="duplicate_category",
        )


def update_category(category: GuestCategory, validated_data: dict) -> GuestCategory:
    """Apply partial updates (rename / reorder) to an existing category."""

    try:
        for field, value in validated_data.items():
            setattr(category, field, value)

        category.save()

    except IntegrityError:
        raise GuestError(
            "A category with this name already exists for this event.",
            code="duplicate_category",
        )

    return category


def delete_category(category: GuestCategory) -> None:
    """Delete a guest category.

    Guests in this category are NOT deleted - Guest.category is
    SET_NULL, so they simply become uncategorized (see guests/models.py).
    """

    category.delete()


# --------------------------------------------------
# Contact Import (Phase 16)
# --------------------------------------------------

def bulk_import_guests(event, organizer, rows: list[dict]) -> dict:
    """Create many guests at once from a reviewed Contact Picker batch.

    `rows` is already-validated data from ContactImportRowSerializer (one
    dict per row: name, mobile_number, email, category, family_member_count).

    Mirrors import_guests_from_csv's behavior/shape (same guest-limit
    enforcement, same duplicate detection, same {created_count,
    skipped_count, skipped_rows} result) so the frontend can reuse one
    result-summary UI for both CSV import and Contact import. Each row is
    created individually (not a single bulk_create) so a duplicate mobile
    number in one row doesn't abort the whole batch - every other valid
    row still gets created, exactly like the CSV importer's per-row
    try/except.

    Wrapped in a single atomic transaction: if the guest-limit is hit
    partway through, everything created so far in this call is still kept
    (same "stop here, keep prior successes" behavior as the CSV importer),
    so this is NOT one big all-or-nothing transaction - only each
    individual guest create is atomic against its own IntegrityError.
    """

    created = []
    skipped = []

    current_count = get_event_guest_count(event)

    for index, row in enumerate(rows):
        try:
            check_guest_limit(organizer, current_count)

        except LimitExceededError as error:
            skipped.append(
                {"row": index + 1, "reason": error.message}
            )
            break

        try:
            with transaction.atomic():
                guest = Guest.objects.create(
                    event=event,
                    category=row.get("category"),
                    name=row["name"],
                    mobile_number=row["mobile_number"],
                    email=row.get("email", ""),
                    family_member_count=row.get("family_member_count", 3),
                )

        except IntegrityError:
            skipped.append(
                {
                    "row": index + 1,
                    "reason": f"Duplicate mobile number ({row['mobile_number']}) for this event.",
                }
            )
            continue

        created.append(guest)
        current_count += 1

    return {
        "created_count": len(created),
        "skipped_count": len(skipped),
        "skipped_rows": skipped,
    }