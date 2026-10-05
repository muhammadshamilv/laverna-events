import base64
import io
import re
import secrets
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import IntegrityError
from memberships.services import add_template_to_library
from memberships.utils import LimitExceededError, check_template_limit
from PIL import Image, ImageDraw, ImageFont, ImageStat

from .models import ActiveFilledTemplate, Invitation, InvitationTemplate


class InvitationError(Exception):
    """Raised when an invitation action cannot be completed."""

    def __init__(self, message: str, code: str = "invitation_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def generate_response_token() -> str:
    """Generate a URL-safe, hard-to-guess token for the guest response link."""

    return secrets.token_urlsafe(24)


def build_placeholder_context(event, guest) -> dict:
    """Build the fixed standard placeholder dict for a given event+guest.

    This remains the single source of truth for what the standard fields
    (event_name, event_date, etc.) default to when an organizer starts
    filling a template on the Templates page - the fill-in form
    pre-populates from this, but the organizer can then override any
    value before confirming (see fill_active_template).
    """

    return {
        "guest_name": guest.name if guest is not None else "{guest_name}",
        "event_name": event.name,
        "event_date": event.event_date.strftime("%d %B %Y"),
        "event_time": event.event_time.strftime("%I:%M %p"),
        "venue_name": event.venue_name or "the venue",
        "venue_address": event.address or "",
        "host_name": event.host_name or event.organizer.full_name,
    }


def render_template_text(template: InvitationTemplate, event, guest) -> str:
    """Substitute the standard placeholders into a template's body_text.

    Kept for the legacy per-guest preview path. The main send flow uses
    render_active_template_for_guest instead, which substitutes from an
    ActiveFilledTemplate's confirmed values, not live event data.
    """

    context = build_placeholder_context(event, guest)

    try:
        return template.body_text.format(**context)

    except KeyError as error:
        raise InvitationError(
            f"This template uses an unknown placeholder: {{{error.args[0]}}}. "
            f"Supported placeholders: {', '.join(InvitationTemplate.PLACEHOLDER_FIELDS)}.",
            code="invalid_placeholder",
        )


def preview_template(template: InvitationTemplate, event, guest) -> dict:
    """Return a preview of what this template will look like for a specific
    guest+event, WITHOUT generating or persisting an Invitation."""

    result = {
        "channel": template.channel,
        "rendered_text": "",
        "has_image": bool(template.background_image),
    }

    if template.body_text:
        result["rendered_text"] = render_template_text(template, event, guest)

    return result


# ---------------------------------------------------------------------------
# Invitation image rendering
# ---------------------------------------------------------------------------

class _SafeDict(dict):
    """format_map helper: an unknown {placeholder} stays as typed instead
    of raising KeyError."""

    def __missing__(self, key):
        return "{" + key + "}"


# Fonts committed with the project (backend/invitations/fonts/) are tried
# first, so rendering looks the same on any server - including hosts that
# have no system fonts installed.
_FONT_DIR = Path(__file__).resolve().parent / "fonts"

_BOLD_FONT_CANDIDATES = [
    str(_FONT_DIR / "DejaVuSans-Bold.ttf"),
    "DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "arialbd.ttf",
    "Arial Bold.ttf",
]

_REGULAR_FONT_CANDIDATES = [
    str(_FONT_DIR / "DejaVuSans.ttf"),
    "DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "arial.ttf",
    "Arial.ttf",
]


def _load_font(bold: bool, size: int):
    """Load a TrueType font at `size`, falling back to Pillow's default."""

    candidates = _BOLD_FONT_CANDIDATES if bold else _REGULAR_FONT_CANDIDATES

    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue

    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def _wrap_text(draw, text: str, font, max_width: int) -> list[str]:
    """Word-wrap `text` to `max_width` pixels. Blank lines are kept."""

    lines: list[str] = []

    for paragraph in text.split("\n"):
        words = paragraph.split()

        if not words:
            lines.append("")
            continue

        current = words[0]

        for word in words[1:]:
            trial = f"{current} {word}"

            if draw.textlength(trial, font=font) <= max_width:
                current = trial
            else:
                lines.append(current)
                current = word

        lines.append(current)

    return lines


def _line_height(draw, font) -> int:
    bbox = draw.textbbox((0, 0), "Ag", font=font)
    return max(1, int((bbox[3] - bbox[1]) * 1.45))


def _open_background(template: InvitationTemplate) -> Image.Image:
    """Open the template's background image as an RGB Pillow image.

    Goes through Django's storage layer (not a filesystem path) so it
    works for local disk and for cloud storage alike.
    """

    with template.background_image.open("rb") as background_file:
        data = background_file.read()

    return Image.open(io.BytesIO(data)).convert("RGB")


def _compose_invitation_image(
    template: InvitationTemplate,
    context: dict,
    custom_pairs: list[tuple[str, str]],
    max_width: int | None = None,
) -> ContentFile:
    """Draw the invitation's text onto the template's background image.

    If the template has body_text, that (with placeholders filled) is
    drawn. Otherwise a default block is drawn: event name, "Dear <guest>",
    date, time, venue and the template's custom fields. The block is
    centered, wrapped to the image width, and drawn dark or light
    depending on how bright the middle of the background is.
    """

    background = _open_background(template)

    if max_width and background.width > max_width:
        ratio = max_width / background.width
        background = background.resize(
            (max_width, int(background.height * ratio)),
            Image.LANCZOS,
        )

    width, height = background.size
    draw = ImageDraw.Draw(background)

    title_font = _load_font(bold=True, size=max(18, int(width * 0.052)))
    body_font = _load_font(bold=False, size=max(14, int(width * 0.034)))
    max_text_width = int(width * 0.62)

    middle = background.crop(
        (int(width * 0.18), int(height * 0.30), int(width * 0.82), int(height * 0.75))
    ).convert("L")
    brightness = ImageStat.Stat(middle).mean[0]
    text_color = "#2B2B2B" if brightness >= 130 else "#FFFFFF"

    rows: list[tuple[str, object]] = []

    if template.body_text:
        rendered = template.body_text.format_map(_SafeDict(context))

        for line in _wrap_text(draw, rendered, body_font, max_text_width):
            rows.append((line, body_font))

    else:
        for line in _wrap_text(draw, str(context.get("event_name", "")), title_font, max_text_width):
            rows.append((line, title_font))

        rows.append(("", body_font))
        rows.append((f"Dear {context.get('guest_name', '')},", body_font))
        rows.append(("", body_font))
        rows.append((f"Date: {context.get('event_date', '')}", body_font))
        rows.append((f"Time: {context.get('event_time', '')}", body_font))

        for line in _wrap_text(draw, f"Venue: {context.get('venue_name', '')}", body_font, max_text_width):
            rows.append((line, body_font))

        for label, value in custom_pairs:
            for line in _wrap_text(draw, f"{label}: {value}", body_font, max_text_width):
                rows.append((line, body_font))

    heights = [
        _line_height(draw, font) if text else int(_line_height(draw, font) * 0.6)
        for text, font in rows
    ]

    total_height = sum(heights)
    y = max(int(height * 0.20), int((height - total_height) / 2))

    for (text, font), line_h in zip(rows, heights):
        if text:
            text_width = draw.textlength(text, font=font)
            draw.text(((width - text_width) / 2, y), text, fill=text_color, font=font)

        y += line_h

    buffer = io.BytesIO()
    background.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)

    return ContentFile(buffer.read())


def _render_invitation_image(template: InvitationTemplate, event, guest, extra_context: dict | None = None) -> ContentFile:
    """Render an invitation image from live event data (legacy per-guest
    path). The main send flow uses render_active_template_image."""

    context = build_placeholder_context(event, guest)

    if extra_context:
        context = {**context, **extra_context}

    return _compose_invitation_image(template, context, custom_pairs=[])


def render_active_template_image(active: ActiveFilledTemplate, guest_name: str, max_width: int | None = None) -> ContentFile:
    """Render the organizer's CONFIRMED filled values onto the template's
    background image, for one guest name (or a sample name for previews)."""

    template = active.template

    context = {**active.standard_values, **active.custom_values, "guest_name": guest_name}

    custom_pairs = [
        (field.label, str(active.custom_values.get(field.field_key, "")))
        for field in template.custom_fields.order_by("display_order", "id")
    ]

    return _compose_invitation_image(template, context, custom_pairs, max_width=max_width)


def build_active_template_preview(active: ActiveFilledTemplate, guest_name: str = "Guest Name") -> dict:
    """What the Templates page shows after the organizer confirms the
    form: the card with their text drawn on it (if the template has a
    background image) and the rendered message text (if it has any)."""

    template = active.template

    preview_text = ""

    if active.rendered_preview_text:
        preview_text = active.rendered_preview_text.replace("{guest_name}", guest_name)

    image = None

    if template.background_image:
        try:
            content = render_active_template_image(active, guest_name, max_width=720)
            image = "data:image/jpeg;base64," + base64.b64encode(content.read()).decode("ascii")
        except Exception:
            image = None

    return {
        "template_id": template.id,
        "template_name": template.name,
        "has_image": bool(template.background_image),
        "image": image,
        "text": preview_text,
    }


def get_or_create_invitation(event, guest, template_id, organizer) -> Invitation:
    """Get the existing invitation for this guest+template, or generate a new one.

    Legacy path, kept for compatibility. The main send flow
    (send_active_template_to_guest in notifications) does not call this.
    """

    template = InvitationTemplate.objects.filter(
        pk=template_id,
        is_active=True,
    ).first()

    if template is None:
        raise InvitationError(
            "No active invitation template found with this ID.",
            code="template_not_found",
        )

    if template.channel in (
        InvitationTemplate.Channel.WHATSAPP,
        InvitationTemplate.Channel.SMS,
        InvitationTemplate.Channel.VOICE_CALL,
    ) and not template.body_text:
        raise InvitationError(
            "This template has no message content configured. Please contact support.",
            code="template_missing_body",
        )

    try:
        check_template_limit(organizer, template)

    except LimitExceededError as error:
        raise InvitationError(error.message, code=error.code)

    add_template_to_library(organizer, template)

    existing = Invitation.objects.filter(guest=guest, template=template).first()

    if existing is not None:
        return existing

    rendered_text = ""

    if template.body_text:
        rendered_text = render_template_text(template, event, guest)

    try:
        invitation = Invitation.objects.create(
            event=event,
            guest=guest,
            template=template,
            response_token=generate_response_token(),
            rendered_text=rendered_text,
        )

    except IntegrityError:
        invitation = Invitation.objects.get(guest=guest, template=template)
        return invitation

    if template.background_image:
        try:
            image_content = _render_invitation_image(template, event, guest)
            invitation.image_file.save(
                f"invitation_{invitation.pk}.jpg",
                image_content,
                save=True,
            )

        except Exception:
            invitation.status = Invitation.Status.FAILED
            invitation.save(update_fields=["status", "updated_at"])

            raise InvitationError(
                "Invitation record created, but image rendering failed. "
                "Please contact support.",
                code="render_failed",
            )

    return invitation


def upload_custom_template(organizer, validated_data: dict) -> InvitationTemplate:
    """Create a new custom InvitationTemplate owned by this organizer.

    validated_data may include custom_fields (a list of {field_key,
    label} dicts) - these are created as TemplateCustomField rows right
    after the template itself.
    """

    draft_template = InvitationTemplate(
        name=validated_data["name"],
        description=validated_data.get("description", ""),
        channel=validated_data["channel"],
        body_text=validated_data.get("body_text", ""),
        owner=organizer,
        is_custom=True,
    )

    try:
        check_template_limit(organizer, draft_template)

    except LimitExceededError as error:
        raise InvitationError(error.message, code=error.code)

    template = InvitationTemplate.objects.create(
        name=validated_data["name"],
        description=validated_data.get("description", ""),
        channel=validated_data["channel"],
        body_text=validated_data.get("body_text", ""),
        preview_image=validated_data.get("preview_image"),
        background_image=validated_data.get("background_image"),
        owner=organizer,
        is_custom=True,
        is_active=True,
    )

    from .models import TemplateCustomField

    for index, field in enumerate(validated_data.get("custom_fields", [])):
        TemplateCustomField.objects.create(
            template=template,
            field_key=field["field_key"],
            label=field["label"],
            display_order=index,
        )

    add_template_to_library(organizer, template)

    return template


# ---------------------------------------------------------------------------
# Select -> fill -> confirm -> (send from Guests page) -> deselect
# ---------------------------------------------------------------------------

def _all_placeholder_keys(template: InvitationTemplate) -> list[str]:
    """Return every placeholder key this template's body_text may use:
    the fixed standard set plus this template's own custom field keys."""

    return list(InvitationTemplate.PLACEHOLDER_FIELDS) + template.custom_field_keys()


def _extract_used_placeholders(body_text: str) -> set[str]:
    return set(re.findall(r"\{(\w+)\}", body_text))


def fill_active_template(organizer, template_id: int, event_id: int, standard_values: dict, custom_values: dict) -> ActiveFilledTemplate:
    """Select a template, tie it to an event, and confirm its filled-in
    content as the organizer's ONE active filled template.

    This REPLACES any previously active filled template for this
    organizer (OneToOneField). standard_values should normally start as
    the event's own auto-filled values but may be edited by the organizer
    before confirming; custom_values must cover every TemplateCustomField
    this template defines.

    Raises InvitationError on a missing/inactive template, a missing
    event not owned by the organizer, a missing required custom field
    value, or an unknown placeholder in body_text.
    """

    from events.models import Event

    template = InvitationTemplate.objects.filter(pk=template_id, is_active=True).first()

    if template is None:
        raise InvitationError(
            "No active invitation template found with this ID.",
            code="template_not_found",
        )

    event = Event.objects.filter(pk=event_id, organizer=organizer).first()

    if event is None:
        raise InvitationError(
            "No event found with this ID.",
            code="event_not_found",
        )

    if template.channel in (
        InvitationTemplate.Channel.WHATSAPP,
        InvitationTemplate.Channel.SMS,
        InvitationTemplate.Channel.VOICE_CALL,
    ) and not template.body_text:
        raise InvitationError(
            "This template has no message content configured. Please contact support.",
            code="template_missing_body",
        )

    try:
        check_template_limit(organizer, template)

    except LimitExceededError as error:
        raise InvitationError(error.message, code=error.code)

    required_custom_keys = set(template.custom_field_keys())
    provided_custom_keys = set(custom_values.keys())
    missing_custom = required_custom_keys - provided_custom_keys

    if missing_custom:
        raise InvitationError(
            f"Missing value(s) for: {', '.join(sorted(missing_custom))}.",
            code="missing_custom_field",
        )

    defaults = build_placeholder_context(event, guest=None)
    merged_standard = {**defaults, **{k: v for k, v in standard_values.items() if k in InvitationTemplate.PLACEHOLDER_FIELDS}}
    merged_standard.pop("guest_name", None)

    full_context = {**merged_standard, **{k: custom_values[k] for k in required_custom_keys}}
    full_context["guest_name"] = "{guest_name}"

    rendered_preview_text = ""

    if template.body_text:
        used = _extract_used_placeholders(template.body_text)
        allowed = set(_all_placeholder_keys(template))
        unknown = used - allowed

        if unknown:
            raise InvitationError(
                f"This template uses an unknown placeholder: "
                f"{', '.join('{' + p + '}' for p in sorted(unknown))}. "
                f"Supported placeholders: {', '.join('{' + p + '}' for p in sorted(allowed))}.",
                code="invalid_placeholder",
            )

        try:
            rendered_preview_text = template.body_text.format(**full_context)
        except KeyError as error:
            raise InvitationError(
                f"This template uses an unknown placeholder: {{{error.args[0]}}}.",
                code="invalid_placeholder",
            )

    add_template_to_library(organizer, template)

    active, _created = ActiveFilledTemplate.objects.update_or_create(
        organizer=organizer,
        defaults={
            "template": template,
            "event": event,
            "standard_values": merged_standard,
            "custom_values": {k: custom_values[k] for k in required_custom_keys},
            "rendered_preview_text": rendered_preview_text,
        },
    )

    return active


def get_active_filled_template(organizer) -> ActiveFilledTemplate | None:
    """Return the organizer's current active filled template, or None."""

    return ActiveFilledTemplate.objects.filter(organizer=organizer).select_related("template", "event").first()


def deselect_active_template(organizer) -> None:
    """Clear the organizer's active filled template, returning the
    Templates page to its background-only state."""

    ActiveFilledTemplate.objects.filter(organizer=organizer).delete()


def render_active_template_for_guest(active: ActiveFilledTemplate, guest) -> str:
    """Substitute ONLY the guest's name into the already-fixed
    rendered_preview_text.

    Everything else (event fields, custom fields) was locked in at
    fill-time. A plain token replace is used instead of str.format so a
    literal brace typed into a field (e.g. "Hall {A}") can never crash a
    send.
    """

    if not active.rendered_preview_text:
        return ""

    return active.rendered_preview_text.replace("{guest_name}", guest.name)


# ---------------------------------------------------------------------
# Reminder schedules
# ---------------------------------------------------------------------

def get_applicable_schedule(guest):
    """Return the ReminderSchedule that applies to this guest, or None.

    An individual guest-level schedule takes priority over that guest's
    category-level schedule. A guest with no category and no individual
    schedule gets None (no automatic reminder).
    """

    from .models import ReminderSchedule

    individual = ReminderSchedule.objects.filter(guest=guest, is_active=True).first()

    if individual is not None:
        return individual

    if guest.category_id is None:
        return None

    return ReminderSchedule.objects.filter(category=guest.category, is_active=True).first()


def upsert_reminder_schedule(event, delay_hours: int, category=None, guest=None):
    """Create or replace the single active schedule for this category/guest.

    Setting a new one deactivates any existing one for the same scope
    first, rather than erroring.
    """

    from .models import ReminderSchedule

    existing_qs = ReminderSchedule.objects.filter(is_active=True)
    existing_qs = existing_qs.filter(guest=guest) if guest is not None else existing_qs.filter(category=category)
    existing_qs.update(is_active=False)

    return ReminderSchedule.objects.create(
        event=event,
        category=category,
        guest=guest,
        delay_hours=delay_hours,
        is_active=True,
    )