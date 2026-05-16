"""
Agreement PDF Generator using ReportLab.
Generates speaker engagement agreements based on entity/company.
Header and footer repeat on every page.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas
from io import BytesIO


COMPANY_DETAILS = {
    "gennova": {
        "name": "Gennova Biopharmaceuticals Limited",
        "short": "Gennova",
        "footer_line1": "Plot No. P-1 & P-2, IT-BT Park, Phase -II, MIDC, Hinjewadi, Pune - 411 057, Maharashtra India, Tel: 020",
        "footer_line2": "35070033/35070000 E-mail:corporate@Gennova.co.in Website: www.Gennova.com CIN: U24231PN1981PLC024251",
    },
    "emcutix": {
        "name": "Emcutix Biopharmaceuticals Limited",
        "short": "Emcutix",
        "footer_line1": "Registered Office: Plot No. P-1 & P-2, IT-BT Park, Phase-II, M.I.D.C., Hinjawadi, Pune - 411057, Maharashtra, India",
        "footer_line2": "Phone Nos.: +91 20-35070033/ 35070000 | Fax No.: +91 20 3507 0060 | E-mail: corporate@emcutix.com | Website: www.emcutix.com | CIN: U21002PN2024PLC234721",
    },
    "emcure": {
        "name": "Emcure Pharmaceuticals Limited",
        "short": "Emcure",
        "footer_line1": "Registered Office: Emcure Pharmaceuticals Limited, Plot: P1 & P2, It-Bt Park, Midc Phase I, Hinjawadi, Pune, India.",
        "footer_line2": "Phone No.: +91 20-27120084, 30610000, 40700000 Fax No.: 91 20-30610111 E-mail:corporate@emcure.co.in Website: www.emcure.com CIN:U24231PN198PLC024251",
    },
}


def get_company_key(entity_name: str) -> str:
    """Determine company key from entity name."""
    if not entity_name:
        return "emcure"
    lower = entity_name.lower()
    if "gennova" in lower or "ebt" in lower:
        return "gennova"
    elif "emcutix" in lower or "emct" in lower:
        return "emcutix"
    return "emcure"


def _header_footer(canvas_obj, doc, company):
    """Draw header and footer on every page."""
    canvas_obj.saveState()
    width, height = A4

    # Header — company name centered at top
    canvas_obj.setFont("Helvetica-Bold", 16)
    canvas_obj.drawCentredString(width / 2, height - 1.5 * cm, company["name"])

    # Footer — line separator + two lines of text
    footer_y = 1.8 * cm
    canvas_obj.setStrokeColorRGB(0.7, 0.7, 0.7)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(2.5 * cm, footer_y + 0.3 * cm, width - 2.5 * cm, footer_y + 0.3 * cm)

    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.setFillColorRGB(0.4, 0.4, 0.4)
    canvas_obj.drawCentredString(width / 2, footer_y, company["footer_line1"])
    canvas_obj.drawCentredString(width / 2, footer_y - 0.35 * cm, company["footer_line2"])

    canvas_obj.restoreState()


def generate_agreement_pdf(
    agreement_code: str,
    date_str: str,
    hcp_name: str,
    hcp_address: str,
    hcp_qualification: str,
    hcp_pan: str,
    event_title: str,
    event_topic: str,
    event_date: str,
    event_venue: str,
    honorarium_amount: float,
    entity_name: str = "Emcure",
) -> bytes:
    """Generate agreement PDF and return bytes."""
    company_key = get_company_key(entity_name)
    company = COMPANY_DETAILS[company_key]

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=3 * cm,      # Extra space for header
        bottomMargin=2.8 * cm,  # Extra space for footer
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='Justify', parent=styles['Normal'],
        alignment=TA_JUSTIFY, fontSize=10.5, leading=14,
    ))
    styles.add(ParagraphStyle(
        name='CenterBold', parent=styles['Normal'],
        alignment=TA_CENTER, fontSize=12, leading=16, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        name='Bold', parent=styles['Normal'],
        fontSize=10.5, leading=14, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        name='RightAligned', parent=styles['Normal'],
        alignment=2, fontSize=10,
    ))
    styles.add(ParagraphStyle(
        name='Normal10', parent=styles['Normal'],
        fontSize=10.5, leading=14,
    ))

    elements = []

    # Code and Date (right-aligned, below header)
    elements.append(Paragraph(f"<b>{agreement_code}</b>", styles['RightAligned']))
    elements.append(Paragraph(f"Date : {date_str}", styles['RightAligned']))
    elements.append(Spacer(1, 12))

    # To section
    elements.append(Paragraph("To,", styles['Normal10']))
    elements.append(Paragraph(f"Name: {hcp_name}", styles['Normal10']))
    if hcp_address:
        elements.append(Paragraph(hcp_address, styles['Normal10']))
    elements.append(Spacer(1, 20))

    # Subject
    elements.append(Paragraph(
        "Sub: Engagement of your services for the purposes specified in this letter.",
        styles['Normal10'],
    ))
    elements.append(Spacer(1, 25))

    # Dear
    elements.append(Paragraph(f"Dear {hcp_name}", styles['Normal10']))
    elements.append(Spacer(1, 12))

    # Points 1-10
    points = [
        f'As you are aware, {company["name"]} ("{company["short"]}") is a leading pharmaceutical company in India with global presence and is in the business of manufacturing, marketing, sale and distribution of various pharmaceuticals, nutraceuticals and other products. In its efforts towards continuous medical education, {company["short"]} organizes various scientific events, informational programs, meeting, seminars as per industry norms, where it invites various eminent industry professionals to come and speak on different topics.',
        f'In this connection, {company["short"]} proposes to organize an event "{event_title}", the details of which are more particularly mentioned in Annexure I.',
        f'We at {company["short"]}, are delighted to invite you as a speaker "{hcp_name}" to address the audience and provide your views on the topic as more particularly mentioned in Annexure I "{event_topic}". The Speaker would be expected to proactively provide inputs and educate on the Topic to the attendees.',
        f'In consideration of your participation as a Speaker, we would like to offer you an honorarium as more particularly mentioned in Annexure I. {company["short"]} will arrange the travelling and hospitality for the Event as per applicable laws and regulations for travel to any location within India for the Event.',
        f'The Speaker understands and acknowledges that this engagement is a voluntary one and that all tasks undertaken by the Speaker will be performed with utmost professionalism and in compliance with the ethics code applicable to all medical professionals.',
        f'The Speaker shall ensure that the contents referred in the Event are not in violation of any proprietary or personal rights of any other person, is factually accurate and contains non-defamatory or otherwise is unlawful or inappropriate.',
        f'The Speaker shall ensure that at the Event a disclaimer shall be provided by them clarifying that their views and opinions expressed are in their individual capacity and that {company["short"]} shall not be held liable in any manner for their views.',
        f'{company["short"]} shall have the right to take documentary proofs in the form of invites, photographs of the Event as permissible under applicable laws. {company["short"]} shall be entitled to record the outcome of the Event and shall have the right to use the same for its internal purposes.',
        f'This letter shall come into force on the date it is signed and shall remain valid for the Event, unless rescinded.',
        f'This letter shall be governed by the laws of India.',
    ]

    for i, point in enumerate(points, 1):
        elements.append(Paragraph(f"<b>{i}.</b> {point}", styles['Justify']))
        elements.append(Spacer(1, 6))

    elements.append(Spacer(1, 15))
    elements.append(Paragraph(
        "You are requested to kindly sign and acknowledge this letter in acceptance of our "
        "engagement on the proposed terms and conditions mentioned herein.",
        styles['Justify'],
    ))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        "We look forward to building a mutually rewarding relationship with you.",
        styles['Justify'],
    ))
    elements.append(Spacer(1, 25))
    elements.append(Paragraph("Yours sincerely,", styles['Normal10']))
    elements.append(Spacer(1, 35))
    elements.append(Paragraph("_____________________________", styles['Normal10']))
    elements.append(Paragraph("Authorised Signatory,", styles['Normal10']))
    elements.append(Paragraph(f"{company['name']}", styles['Normal10']))
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Signed and accepted:", styles['Normal10']))
    elements.append(Spacer(1, 35))
    elements.append(Paragraph(
        "___________________"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;___________________",
        styles['Normal10'],
    ))

    # Page break for Annexure
    elements.append(PageBreak())
    elements.append(Paragraph("<b>Annexure- 1</b>", styles['CenterBold']))
    elements.append(Spacer(1, 20))

    # Part A
    elements.append(Paragraph("<b>1. PART A</b>", styles['Bold']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("<b>Event details:</b>", styles['Bold']))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(f"1.1&nbsp;&nbsp;&nbsp;Topic: {event_topic}", styles['Normal10']))
    elements.append(Paragraph(f"1.2&nbsp;&nbsp;&nbsp;Date &amp; Time of Event: {event_date}", styles['Normal10']))
    elements.append(Paragraph(f"1.3&nbsp;&nbsp;&nbsp;Venue: {event_venue}", styles['Normal10']))
    elements.append(Paragraph("1.4&nbsp;&nbsp;&nbsp;Details of the Speaker:", styles['Normal10']))
    elements.append(Paragraph(f"-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Name: {hcp_name}", styles['Normal10']))
    elements.append(Paragraph(f"-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Medical Certification: {hcp_qualification}", styles['Normal10']))
    elements.append(Paragraph(f"-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PAN details: {hcp_pan}", styles['Normal10']))

    # Part B (only if honorarium > 0)
    if honorarium_amount and honorarium_amount > 0:
        elements.append(Spacer(1, 25))
        elements.append(Paragraph("<b>2. PART B</b>", styles['Bold']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("<b>Payment Details:</b>", styles['Bold']))
        elements.append(Spacer(1, 8))
        amount_str = f"#{int(honorarium_amount)}"
        elements.append(Paragraph(
            f"The Speaker shall be paid an honorarium of {amount_str} Rupees Only for his/her "
            f"role as a speaker in the meeting which shall be exclusive of GST and subject to "
            f"deduction of applicable tax at source.",
            styles['Justify'],
        ))

    # Build with header/footer on every page
    def on_page(canvas_obj, doc_obj):
        _header_footer(canvas_obj, doc_obj, company)

    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
    return buffer.getvalue()
