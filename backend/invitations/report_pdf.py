"""Phase 24: renders the invitation report (see reports.py) as a PDF,
using reportlab - already a project dependency (invitation image/QR
rendering elsewhere uses it too), so no new library is needed.
"""

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

CHANNEL_LABELS = {
    "WHATSAPP": "WhatsApp",
    "EMAIL": "Email",
    "SMS": "SMS",
    "VOICE_CALL": "Voice Call",
}

RESPONSE_LABELS = {
    "PENDING": "Pending",
    "ACCEPTED": "Accepted",
    "REJECTED": "Declined",
    "MAYBE": "Maybe",
}


def _channel_totals_table(send_summary: dict) -> Table:
    header = ["Channel", "Sent", "Failed", "Reminders Sent"]
    data = [header]

    for channel, totals in send_summary.items():
        data.append(
            [
                CHANNEL_LABELS.get(channel, channel),
                str(totals["sent"]),
                str(totals["failed"]),
                str(totals["reminders_sent"]),
            ]
        )

    table = Table(data, hAlign="LEFT", colWidths=[4 * cm, 3 * cm, 3 * cm, 4 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2A44")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7DBE3")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _rsvp_totals_table(rsvp_summary: dict) -> Table:
    header = ["Response", "Guests", "Headcount"]
    data = [header]

    for response_status, totals in rsvp_summary.items():
        data.append(
            [
                RESPONSE_LABELS.get(response_status, response_status),
                str(totals["guests"]),
                str(totals["headcount"]),
            ]
        )

    table = Table(data, hAlign="LEFT", colWidths=[4 * cm, 4 * cm, 4 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2A44")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7DBE3")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _guest_detail_table(guest_details: list[dict]) -> Table:
    header = ["Guest", "Category", "Invitation", "Response", "Channels", "Reminders"]
    data = [header]

    for row in guest_details:
        data.append(
            [
                row["guest_name"],
                row["category_name"] or "Uncategorized",
                row["invitation_status"].replace("_", " ").title(),
                RESPONSE_LABELS.get(row["response_status"], row["response_status"]),
                ", ".join(CHANNEL_LABELS.get(c, c) for c in row["channels_used"]) or "-",
                str(row["reminders_sent"]),
            ]
        )

    table = Table(
        data,
        hAlign="LEFT",
        colWidths=[3.8 * cm, 2.8 * cm, 2.6 * cm, 2.4 * cm, 3.2 * cm, 2.2 * cm],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2A44")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7DBE3")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
                ("ALIGN", (2, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def render_report_pdf(report: dict) -> bytes:
    """Render the full report dict (see invitations.reports.build_full_report)
    as a PDF, returned as raw bytes."""

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        title=f"Invitation Report - {report['event_name']}",
    )

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    body_style = styles["BodyText"]

    elements = []

    elements.append(Paragraph(report["event_name"], title_style))
    elements.append(Paragraph("Invitation Report", heading_style))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(
        Paragraph(
            f"Total guests: {report['total_guests']} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"Total expected headcount: {report['total_expected_headcount']}",
            body_style,
        )
    )
    elements.append(Spacer(1, 0.6 * cm))

    elements.append(Paragraph("Send Summary", heading_style))
    elements.append(Spacer(1, 0.2 * cm))
    elements.append(_channel_totals_table(report["send_summary"]))
    elements.append(Spacer(1, 0.6 * cm))

    elements.append(Paragraph("RSVP Summary", heading_style))
    elements.append(Spacer(1, 0.2 * cm))
    elements.append(_rsvp_totals_table(report["rsvp_summary"]))
    elements.append(Spacer(1, 0.6 * cm))

    if report["category_breakdown"]:
        elements.append(Paragraph("Breakdown by Category", heading_style))
        elements.append(Spacer(1, 0.2 * cm))

        for category in report["category_breakdown"]:
            elements.append(Paragraph(category["category_name"], styles["Heading3"]))
            elements.append(Spacer(1, 0.15 * cm))
            elements.append(_channel_totals_table(category["send_summary"]))
            elements.append(Spacer(1, 0.2 * cm))
            elements.append(_rsvp_totals_table(category["rsvp_summary"]))
            elements.append(Spacer(1, 0.4 * cm))

    elements.append(PageBreak())
    elements.append(Paragraph("Guest Detail Log", heading_style))
    elements.append(Spacer(1, 0.2 * cm))
    elements.append(_guest_detail_table(report["guest_details"]))

    doc.build(elements)

    return buffer.getvalue()