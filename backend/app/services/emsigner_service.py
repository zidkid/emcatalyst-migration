"""
emSigner (Embedded Sign) API Integration Service.
Handles agreement generation, status checking, and document download.
"""
import httpx
import base64
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

BASE_URL = settings.EMSIGNER_BASE_URL


async def send_document_for_signing(
    event_code: str,
    doctor_email: str,
    pdf_bytes: bytes,
    document_name: str = "agreement.pdf",
) -> dict:
    """
    Send a PDF document to emSigner for digital signing.
    Returns dict with workflow_id and full response on success, error info on failure.
    """
    file_data = base64.b64encode(pdf_bytes).decode("utf-8")

    payload = {
        "EventID": event_code,
        "Name": settings.EMSIGNER_SENDER_NAME,
        "EmailId": settings.EMSIGNER_SENDER_EMAIL,
        "DonotSendCompletionMailToParticipants": False,
        "DoNotNotifyCustomer": False,
        "RedirectURL": "",
        "SignatoryEmailIds": [doctor_email],
        "lstDocumentDetails": [
            {
                "TemplateId": settings.EMSIGNER_TEMPLATE_ID,
                "DocumentName": document_name,
                "FileData": file_data,
                "ControlDetails": [
                    {
                        "SearchText": "emsignerSignaturePlace",
                        "Anchor": "Middle",
                        "AssignedTo": 1,
                    }
                ],
            }
        ],
    }

    # Build request info (without FileData for logging)
    request_log = {**payload, "lstDocumentDetails": [{**payload["lstDocumentDetails"][0], "FileData": "<base64_pdf_omitted>"}]}

    try:
        async with httpx.AsyncClient(verify=False, timeout=30) as client:
            response = await client.post(
                f"{BASE_URL}Login_and_Send_Document",
                json=payload,
            )
            # Try JSON first, then XML
            data = None
            try:
                data = response.json()
            except Exception:
                # Try parsing as XML
                try:
                    import xml.etree.ElementTree as ET
                    root = ET.fromstring(response.text)
                    data = {}
                    for child in root:
                        tag = child.tag
                        val = child.text
                        if val and val.lower() == 'true':
                            val = True
                        elif val and val.lower() == 'false':
                            val = False
                        data[tag] = val
                except Exception:
                    data = {"raw_response": response.text[:500], "status_code": response.status_code}

            workflow_id = str(data.get("WorkflowId", "")) if (data.get("IsSuccess") or data.get("Status")) else None
            logger.info(f"emSigner: Document sent. Response={data}")
            return {
                "success": bool(workflow_id),
                "workflow_id": workflow_id,
                "request": request_log,
                "response": data,
            }
    except Exception as e:
        logger.error(f"emSigner send error: {e}")
        return {
            "success": False,
            "workflow_id": None,
            "request": request_log,
            "response": {"error": str(e)},
        }


async def get_signing_status(workflow_id: str) -> Optional[dict]:
    """
    Check the signing status of a document.
    Returns the status dict or None on failure.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=15) as client:
            response = await client.get(
                f"{BASE_URL}Get_Status",
                params={"WorkFlowId": workflow_id},
            )
            try:
                data = response.json()
            except Exception:
                # Try XML parsing
                try:
                    import xml.etree.ElementTree as ET
                    root = ET.fromstring(response.text)
                    # Parse XML status response
                    data = {"IsSuccess": True, "Response": []}
                    for child in root:
                        if child.tag == "IsSuccess":
                            data["IsSuccess"] = child.text.lower() == "true" if child.text else False
                        elif child.tag == "Response" or child.tag == "Signatories":
                            # Try to extract signatory info
                            for sig in root.iter("Signatories"):
                                sig_data = {}
                                for field in sig:
                                    sig_data[field.tag] = field.text
                                if sig_data:
                                    data["Response"] = [{"Signatories": [sig_data]}]
                                    break
                except Exception:
                    return None

            if data.get("IsSuccess") and data.get("Response"):
                doc_info = data["Response"][0] if data["Response"] else {}
                signatories = doc_info.get("Signatories", [])
                if signatories:
                    signer = signatories[0]
                    return {
                        "status": signer.get("Status", "Pending"),
                        "signed_date": signer.get("SignedDate"),
                        "remarks": signer.get("Remarks"),
                        "document_number": doc_info.get("DocumentNumber"),
                    }
            return None
    except Exception as e:
        logger.error(f"emSigner status check error: {e}")
        return None


async def download_signed_document(workflow_id: str) -> Optional[bytes]:
    """
    Download the signed document from emSigner.
    Returns the PDF bytes or None on failure.
    """
    payload = {"WorkFlowId": workflow_id}

    try:
        async with httpx.AsyncClient(verify=False, timeout=30) as client:
            response = await client.post(
                f"{BASE_URL}Download_Document",
                json=payload,
            )
            data = response.json()
            if data.get("IsSuccess") and data.get("Response"):
                file_list = data["Response"].get("FileList", [])
                # Get the main document (not attachment)
                for f in file_list:
                    if not f.get("IsAttachment", False):
                        pdf_b64 = f.get("Base64FileData", "")
                        if pdf_b64:
                            return base64.b64decode(pdf_b64)
            return None
    except Exception as e:
        logger.error(f"emSigner download error: {e}")
        return None
