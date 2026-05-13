import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body_html: str, body_text: str = ""):
    """Send email via SMTP. Falls back to logging if SMTP_HOST not set."""
    from app.core.config import settings
    smtp_host = getattr(settings, "SMTP_HOST", None)
    if not smtp_host:
        print(f"\n{'='*60}")
        print(f"📧 EMAIL TRIGGERED (SMTP not configured - logging only)")
        print(f"{'='*60}")
        print(f"  To:      {to}")
        print(f"  Subject: {subject}")
        print(f"  Body:    {body_text[:500] if body_text else body_html[:500]}")
        print(f"{'='*60}\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = getattr(settings, "SMTP_FROM", "noreply@emcure.com")
        msg["To"] = to
        msg["Subject"] = subject
        if body_text:
            msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        smtp_port = getattr(settings, "SMTP_PORT", 587)
        if smtp_port == 25:
            # Plain SMTP without TLS
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                smtp_user = getattr(settings, "SMTP_USER", "")
                smtp_pass = getattr(settings, "SMTP_PASSWORD", "")
                if smtp_user:
                    server.login(smtp_user, smtp_pass)
                server.sendmail(msg["From"], [to], msg.as_string())
        else:
            # SMTP with STARTTLS (port 587)
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                smtp_user = getattr(settings, "SMTP_USER", "")
                smtp_pass = getattr(settings, "SMTP_PASSWORD", "")
                if smtp_user:
                    server.login(smtp_user, smtp_pass)
                server.sendmail(msg["From"], [to], msg.as_string())
        print(f"✅ EMAIL SENT to {to} | Subject: {subject}")
        return True
    except Exception as e:
        print(f"❌ EMAIL FAILED to {to} | Error: {e}")
        logger.error(f"[EMAIL-ERROR] To={to} | {e}")
        return False


def send_brs_survey_link(doctor_email: str, doctor_name: str, survey_title: str,
                          survey_link: str, honorarium_amount: float):
    subject = f"Bona Fide Research Survey Invitation — {survey_title}"
    body_html = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;">
<div style="max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
  <div style="background:#003087;padding:24px;text-align:center;">
    <h2 style="color:#fff;margin:0;">Emcure Pharmaceuticals</h2>
    <p style="color:#adc8f0;margin:4px 0 0;">Bona Fide Research Survey</p>
  </div>
  <div style="padding:32px;">
    <p>Dear Dr. {doctor_name},</p>
    <p>You have been invited to participate in a <strong>Bona Fide Research Survey</strong>:</p>
    <div style="background:#f5f8ff;border-left:4px solid #003087;padding:16px;margin:16px 0;border-radius:4px;">
      <strong>{survey_title}</strong>
    </div>
    <p>Honorarium: <strong>₹{honorarium_amount:,.0f}</strong></p>
    <p>Please click the button below to review the agreement and complete the survey:</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{survey_link}" style="background:#003087;color:#fff;padding:14px 32px;border-radius:6px;
         text-decoration:none;font-size:16px;font-weight:bold;">Open Survey →</a>
    </div>
    <p style="font-size:12px;color:#888;">If the button doesn't work, copy this link:<br>{survey_link}</p>
  </div>
  <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#999;">
    Emcure Pharmaceuticals Ltd. | This email is auto-generated.
  </div>
</div>
</body></html>
"""
    body_text = f"Dear Dr. {doctor_name},\n\nSurvey: {survey_title}\nHonorarium: ₹{honorarium_amount:,.0f}\nLink: {survey_link}"
    return send_email(doctor_email, subject, body_html, body_text)


def send_vendor_creation_notification(application_code: str, doctor_name: str,
                                       pan: str, bank_name: str, account_no: str, ifsc: str):
    subject = f"New Vendor Creation Required — BRS {application_code}"
    body_html = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;">
<div style="max-width:600px;margin:auto;padding:24px;">
  <h3>Vendor Creation Required</h3>
  <p>A new BRS application requires vendor creation in SAP/MDM:</p>
  <table style="border-collapse:collapse;width:100%;">
    <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;"><strong>BRS Code</strong></td>
        <td style="padding:8px;border:1px solid #ddd;">{application_code}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;"><strong>Doctor Name</strong></td>
        <td style="padding:8px;border:1px solid #ddd;">{doctor_name}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;"><strong>PAN</strong></td>
        <td style="padding:8px;border:1px solid #ddd;">{pan}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;"><strong>Bank Name</strong></td>
        <td style="padding:8px;border:1px solid #ddd;">{bank_name}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;"><strong>Account No</strong></td>
        <td style="padding:8px;border:1px solid #ddd;">{account_no}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;"><strong>IFSC</strong></td>
        <td style="padding:8px;border:1px solid #ddd;">{ifsc}</td></tr>
  </table>
  <p style="margin-top:16px;">Please create the vendor in SAP and update the BRS application accordingly.</p>
</div>
</body></html>
"""
    for email in ["yogesh.thakar@emcure.com", "anup.kumar@emcure.com"]:
        send_email(email, subject, body_html)


def send_brs_doctor_credentials(doctor_email: str, doctor_name: str, brs_code: str,
                                 survey_title: str, login_id: str, password: str,
                                 portal_url: str):
    """Send login credentials to doctor after Division Head approval"""
    subject = f"BRS Survey Access — {survey_title} ({brs_code})"
    body_html = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;">
<div style="max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
  <div style="background:#003087;padding:24px;text-align:center;">
    <h2 style="color:#fff;margin:0;">Emcure Pharmaceuticals</h2>
    <p style="color:#adc8f0;margin:4px 0 0;">BRS Doctor Portal</p>
  </div>
  <div style="padding:32px;">
    <p>Dear Dr. {doctor_name},</p>
    <p>You have been selected to participate in a Bona Fide Research Survey. Your access credentials are below:</p>
    <div style="background:#f5f8ff;border:1px solid #d0dff5;padding:20px;margin:20px 0;border-radius:6px;">
      <p style="margin:0 0 8px;"><strong>Survey:</strong> {survey_title}</p>
      <p style="margin:0 0 8px;"><strong>BRS Code:</strong> {brs_code}</p>
      <hr style="border:none;border-top:1px solid #d0dff5;margin:12px 0;">
      <p style="margin:0 0 8px;"><strong>Login ID:</strong> <code style="background:#e8f0fe;padding:2px 8px;border-radius:3px;">{login_id}</code></p>
      <p style="margin:0;"><strong>Password:</strong> <code style="background:#e8f0fe;padding:2px 8px;border-radius:3px;">{password}</code></p>
    </div>
    <p>Please follow these steps:</p>
    <ol style="padding-left:20px;">
      <li>Click the button below to access the portal</li>
      <li>Login with the credentials above</li>
      <li>Update your personal details</li>
      <li>Sign the agreement</li>
      <li>Complete the survey</li>
    </ol>
    <div style="text-align:center;margin:32px 0;">
      <a href="{portal_url}" style="background:#003087;color:#fff;padding:14px 32px;border-radius:6px;
         text-decoration:none;font-size:16px;font-weight:bold;">Access Portal →</a>
    </div>
    <p style="font-size:12px;color:#888;">Portal URL: {portal_url}</p>
    <p style="font-size:12px;color:#888;">Please do not share your credentials with anyone.</p>
  </div>
  <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#999;">
    Emcure Pharmaceuticals Ltd. | This email is auto-generated.
  </div>
</div>
</body></html>
"""
    body_text = f"""Dear Dr. {doctor_name},

Survey: {survey_title}
BRS Code: {brs_code}

Login ID: {login_id}
Password: {password}

Portal: {portal_url}

Steps: Login → Update Details → Sign Agreement → Complete Survey
"""
    return send_email(doctor_email, subject, body_html, body_text)
