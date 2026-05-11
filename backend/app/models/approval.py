from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class InvoiceStatus(str, enum.Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    COMPLIANCE_APPROVED = "Compliance Approved"
    FINANCE_APPROVED = "Finance Approved"
    GST_VERIFIED = "GST Verified"
    OPEX_APPROVED = "OPEX Approved"
    PAYMENT_INITIATED = "Payment Initiated"
    PAID = "Paid"
    REJECTED = "Rejected"
    ON_HOLD = "On Hold"


class VendorInvoice(Base):
    __tablename__ = "vendor_invoices"

    id = Column(Integer, primary_key=True, index=True)
    serial_no = Column(String(50), unique=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    vendor_code = Column(String(20))
    vendor_name = Column(String(300))
    reference = Column(String(100))
    document_date = Column(DateTime)
    posting_date = Column(DateTime)
    document_type = Column(String(10))
    vendor_amount = Column(Numeric(15, 2))
    exch_rate = Column(String(20))
    currency = Column(String(10), default="INR")
    calculate_tax = Column(String(10))
    comp_code = Column(String(10))
    sp_gl_ind = Column(String(5))
    text = Column(Text)
    payment_method = Column(String(10))
    due_on = Column(DateTime)
    payment_block = Column(String(5))
    baseline_date = Column(DateTime)
    assignment = Column(String(100))
    wt_tax_code = Column(String(20))
    profit_center = Column(String(20))
    cost_center = Column(String(20))
    internal_order = Column(String(20))
    gl_account = Column(String(20))
    tax_code = Column(String(10))
    igst_flag = Column(Boolean, default=False)
    igst_amount = Column(Numeric(12, 2))
    cgst_amount = Column(Numeric(12, 2))
    sgst_amount = Column(Numeric(12, 2))
    tds_amount = Column(Numeric(12, 2))
    net_amount = Column(Numeric(15, 2))
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.PENDING)
    sap_doc_no = Column(String(30))
    utr_no = Column(String(50))
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    submitted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vendor = relationship("Vendor", back_populates="invoices")
    event = relationship("Event")
    submitted_by = relationship("User")
    line_items = relationship("InvoiceLineItem", back_populates="invoice")
    approvals = relationship("InvoiceApproval", back_populates="invoice")
    messages = relationship("InvoiceMessage", back_populates="invoice")
    withholding = relationship("InvoiceWithholding", back_populates="invoice")


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("vendor_invoices.id"), nullable=False)
    item_number = Column(String(10))
    gl_account = Column(String(20))
    amount = Column(Numeric(12, 2))
    cost_center = Column(String(20))
    profit_center = Column(String(20))
    internal_order = Column(String(20))
    tax_code = Column(String(10))
    text = Column(Text)

    invoice = relationship("VendorInvoice", back_populates="line_items")


class InvoiceApproval(Base):
    __tablename__ = "invoice_approvals"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("vendor_invoices.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approver_role = Column(String(100))
    action = Column(String(50))  # Approved / Rejected / Returned
    remarks = Column(Text)
    action_date = Column(DateTime(timezone=True), server_default=func.now())

    invoice = relationship("VendorInvoice", back_populates="approvals")
    approver = relationship("User")


class InvoiceMessage(Base):
    __tablename__ = "invoice_messages"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("vendor_invoices.id"), nullable=False)
    message_type = Column(String(20))  # Info, Error, Warning
    message_text = Column(Text)
    ex_doc_no = Column(String(30))
    ex_message = Column(Text)
    ex_utrno = Column(String(50))
    ex_amount = Column(Numeric(12, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    invoice = relationship("VendorInvoice", back_populates="messages")


class InvoiceWithholding(Base):
    __tablename__ = "invoice_withholding"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("vendor_invoices.id"), nullable=False)
    witht = Column(String(10))
    wt_code = Column(String(10))
    wt_base = Column(Numeric(12, 2))
    wt_amount = Column(Numeric(12, 2))

    invoice = relationship("VendorInvoice", back_populates="withholding")
