from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.base import get_db
from app.models.approval import VendorInvoice, InvoiceApproval, InvoiceStatus
from app.schemas.approval import VendorInvoiceCreate, VendorInvoiceUpdate, VendorInvoiceOut, InvoiceApprovalCreate, InvoiceApprovalOut
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/invoices", tags=["approvals"])


def generate_serial(db: Session) -> str:
    count = db.query(VendorInvoice).count() + 1
    return f"INV{datetime.now().strftime('%Y%m')}{count:05d}"


@router.get("/", response_model=List[VendorInvoiceOut])
def list_invoices(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    vendor_code: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(VendorInvoice)
    if status:
        q = q.filter(VendorInvoice.status == status)
    if vendor_code:
        q = q.filter(VendorInvoice.vendor_code == vendor_code)
    return q.order_by(VendorInvoice.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=VendorInvoiceOut)
def create_invoice(
    data: VendorInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    invoice = VendorInvoice(**data.model_dump(), submitted_by_id=current_user.id)
    invoice.serial_no = generate_serial(db)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}", response_model=VendorInvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    invoice = db.query(VendorInvoice).filter(VendorInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=VendorInvoiceOut)
def update_invoice(invoice_id: int, data: VendorInvoiceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    invoice = db.query(VendorInvoice).filter(VendorInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/approve", response_model=VendorInvoiceOut)
def approve_invoice(
    invoice_id: int,
    approval: InvoiceApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.services.workflow_service import get_step_for_status, can_user_approve_step

    invoice = db.query(VendorInvoice).filter(VendorInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Dynamic workflow authorization
    current_status = invoice.status.value if hasattr(invoice.status, 'value') else str(invoice.status)
    step = get_step_for_status(db, "invoice_approval", current_status)

    if step:
        if not can_user_approve_step(db, current_user, step, invoice.submitted_by_id):
            raise HTTPException(status_code=403, detail="You are not authorized to approve this invoice at this stage")

        if approval.action == "Approved":
            invoice.status = step.approved_status
        elif approval.action == "Rejected":
            invoice.status = InvoiceStatus.REJECTED
        elif approval.action == "OnHold":
            invoice.status = InvoiceStatus.ON_HOLD
    else:
        # Fallback to hardcoded status map
        status_map = {
            "ComplianceUser": InvoiceStatus.COMPLIANCE_APPROVED,
            "FinanceUser": InvoiceStatus.FINANCE_APPROVED,
            "GSTuser": InvoiceStatus.GST_VERIFIED,
            "OPEXUser": InvoiceStatus.OPEX_APPROVED,
        }

        if approval.action == "Approved":
            new_status = status_map.get(approval.approver_role, InvoiceStatus.FINANCE_APPROVED)
            invoice.status = new_status
        elif approval.action == "Rejected":
            invoice.status = InvoiceStatus.REJECTED
        elif approval.action == "OnHold":
            invoice.status = InvoiceStatus.ON_HOLD

    record = InvoiceApproval(
        invoice_id=invoice_id,
        approver_id=current_user.id,
        approver_role=approval.approver_role,
        action=approval.action,
        remarks=approval.remarks
    )
    db.add(record)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/post-to-sap", response_model=VendorInvoiceOut)
def post_to_sap(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    invoice = db.query(VendorInvoice).filter(VendorInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    # SAP posting simulation - in production, call SAP RFC/OData
    invoice.status = InvoiceStatus.PAYMENT_INITIATED
    invoice.sap_doc_no = f"SAP{datetime.now().strftime('%Y%m%d%H%M%S')}"
    db.commit()
    db.refresh(invoice)
    return invoice
