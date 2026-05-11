from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.approval import InvoiceStatus


class InvoiceLineItemBase(BaseModel):
    item_number: Optional[str] = None
    gl_account: Optional[str] = None
    amount: Optional[Decimal] = None
    cost_center: Optional[str] = None
    profit_center: Optional[str] = None
    tax_code: Optional[str] = None
    text: Optional[str] = None


class InvoiceApprovalCreate(BaseModel):
    action: str
    remarks: Optional[str] = None
    approver_role: str


class InvoiceApprovalOut(BaseModel):
    id: int
    approver_role: Optional[str]
    action: str
    remarks: Optional[str]
    action_date: datetime

    class Config:
        from_attributes = True


class VendorInvoiceBase(BaseModel):
    vendor_code: Optional[str] = None
    vendor_name: Optional[str] = None
    reference: Optional[str] = None
    document_date: Optional[datetime] = None
    posting_date: Optional[datetime] = None
    document_type: Optional[str] = None
    vendor_amount: Optional[Decimal] = None
    currency: str = "INR"
    comp_code: Optional[str] = None
    text: Optional[str] = None
    igst_flag: bool = False
    igst_amount: Optional[Decimal] = None
    cgst_amount: Optional[Decimal] = None
    sgst_amount: Optional[Decimal] = None
    tds_amount: Optional[Decimal] = None
    net_amount: Optional[Decimal] = None
    event_id: Optional[int] = None


class VendorInvoiceCreate(VendorInvoiceBase):
    pass


class VendorInvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    sap_doc_no: Optional[str] = None
    utr_no: Optional[str] = None


class VendorInvoiceOut(VendorInvoiceBase):
    id: int
    serial_no: Optional[str]
    status: InvoiceStatus
    sap_doc_no: Optional[str]
    utr_no: Optional[str]
    created_at: datetime
    approvals: List[InvoiceApprovalOut] = []

    class Config:
        from_attributes = True
