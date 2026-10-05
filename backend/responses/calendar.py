"""Builds .ics (iCalendar) files for guest-facing "Add to Calendar" links.

Deliberately hand-rolled rather than pulling in a library (e.g. `icalendar`)
- the RFC 5545 subset needed here (one VEVENT, a few fields, correct line
folding) is small and stable, and avoiding the dependency keeps this a
zero-install addition to requirements.txt.
"""

from datetime import datetime, timedelta

from django.utils.html import strip_tags

# Fixed event block length used for the calendar entry. The Event model
# only stores a start date/time, not a duration, and Phase 23 deliberately
# keeps it that way - a fixed 2-hour block is a reasonable default for a
# calendar placeholder without adding a new field just for this.
EVENT_DURATION = timedelta(hours=2)


def _escape_ics_text(value: str) -> str:
    """Escape text per RFC 5545 (section 3.3.11): backslash, semicolon,
    comma, and newlines need escaping inside TEXT values."""

    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def _fold_line(line: str) -> str:
    """Fold lines longer than 75 octets per RFC 5545 (section 3.1), since
    some calendar clients reject unfolded long lines."""

    if len(line) <= 75:
        return line

    folded = [line[:75]]
    rest = line[75:]

    while rest:
        folded.append(" " + rest[:74])
        rest = rest[74:]

    return "\r\n".join(folded)


def build_event_ics(event, guest) -> bytes:
    """Build a single-VEVENT .ics file for one guest's invitation.

    `event` is an events.models.Event instance, `guest` is a
    guests.models.Guest instance - only used for a personalized SUMMARY/
    DESCRIPTION, not stored anywhere in the file.
    """

    start_dt = datetime.combine(event.event_date, event.event_time)
    end_dt = start_dt + EVENT_DURATION

    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    dtstart = start_dt.strftime("%Y%m%dT%H%M%S")
    dtend = end_dt.strftime("%Y%m%dT%H%M%S")

    summary = _escape_ics_text(event.name)

    description_lines = [f"You're invited to {event.name}."]
    if event.description:
        description_lines.append(strip_tags(event.description))
    description = _escape_ics_text("\n".join(description_lines))

    location_parts = [part for part in (event.venue_name, event.address) if part]
    location = _escape_ics_text(", ".join(location_parts))

    uid = f"invitation-{event.pk}-{guest.pk}@lavernaevents.com"

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LavernaEvents//Invitation//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp}",
        # Written as a local (floating) time in the project's own
        # timezone (Asia/Kolkata) rather than UTC or with a TZID block -
        # simplest correct option for a single-timezone project, and
        # every mainstream calendar app handles a floating DTSTART/DTEND
        # fine for this kind of one-off event invite.
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
    ]

    if location:
        lines.append(f"LOCATION:{location}")

    if event.google_maps_link:
        lines.append(f"URL:{_escape_ics_text(event.google_maps_link)}")

    lines.extend(
        [
            "STATUS:CONFIRMED",
            "END:VEVENT",
            "END:VCALENDAR",
        ]
    )

    folded = [_fold_line(line) for line in lines]

    return ("\r\n".join(folded) + "\r\n").encode("utf-8")