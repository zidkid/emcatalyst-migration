from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class EventStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_code = Column(String(50), unique=True, index=True)
    event_title = Column(String(500), nullable=False)
    event_type = Column(String(100))           # CME, Workshop, Conference, etc.
    event_category = Column(String(100))
    event_date = Column(DateTime)
    event_end_date = Column(DateTime)
    venue = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default="India")
    expected_attendance = Column(Integer)
    actual_attendance = Column(Integer)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=True)
    company_code = Column(String(10))
    cost_center = Column(String(20))
    budget_amount = Column(Numeric(15, 2))
    actual_amount = Column(Numeric(15, 2))
    status = Column(Enum(EventStatus), default=EventStatus.DRAFT)
    initiator_id = Column(Integer, ForeignKey("users.id"))
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    compliance_remarks = Column(Text)
    finance_remarks = Column(Text)
    rejection_reason = Column(Text)
    step = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    initiator = relationship("User", foreign_keys=[initiator_id], back_populates="events_initiated")
    approver = relationship("User", foreign_keys=[approver_id])
    doctors = relationship("EventDoctor", back_populates="event")
    costs = relationship("EventCost", back_populates="event")
    documents = relationship("EventDocument", back_populates="event")
    honorariums = relationship("EventHonorarium", back_populates="event")
    institutions = relationship("EventInstitution", back_populates="event")
    agreements = relationship("EventAgreement", back_populates="event")


class EventDoctor(Base):
    __tablename__ = "event_doctors"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    doctor_name = Column(String(300), nullable=False)
    qualification = Column(String(200))
    specialization = Column(String(200))
    institute = Column(String(300))
    city = Column(String(100))
    mobile_no = Column(String(20))
    email = Column(String(200))
    pan_number = Column(String(20))
    gstin = Column(String(20))
    role = Column(String(100))  # Speaker, Chairperson, Moderator etc.
    bank_name = Column(String(200))
    bank_account_no = Column(String(30))
    ifsc_code = Column(String(20))
    fmv_amount = Column(Numeric(12, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="doctors")


class EventInstitution(Base):
    __tablename__ = "event_institutions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    institution_name = Column(String(300))
    contact_person = Column(String(200))
    mobile_no = Column(String(20))
    email = Column(String(200))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    gstin = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="institutions")


class EventCost(Base):
    __tablename__ = "event_costs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    cost_head = Column(String(200), nullable=False)
    cost_category = Column(String(100))
    vendor_name = Column(String(300))
    estimated_amount = Column(Numeric(12, 2))
    actual_amount = Column(Numeric(12, 2))
    currency = Column(String(10), default="INR")
    gst_applicable = Column(Boolean, default=False)
    gst_rate = Column(Numeric(5, 2))
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="costs")


class EventDocument(Base):
    __tablename__ = "event_documents"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    document_type = Column(String(100))
    document_name = Column(String(300))
    file_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="documents")
    uploaded_by = relationship("User")


class EventHonorarium(Base):
    __tablename__ = "event_honorariums"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("event_doctors.id"), nullable=True)
    doctor_name = Column(String(300))
    session_type = Column(String(100))
    duration_minutes = Column(Integer)
    fmv_per_hour = Column(Numeric(10, 2))
    honorarium_amount = Column(Numeric(12, 2))
    tds_applicable = Column(Boolean, default=True)
    tds_rate = Column(Numeric(5, 2))
    tds_amount = Column(Numeric(12, 2))
    net_payable = Column(Numeric(12, 2))
    payment_status = Column(String(50), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="honorariums")
    doctor = relationship("EventDoctor")


class EventDocumentType(Base):
    __tablename__ = "event_document_types"

    id = Column(Integer, primary_key=True)
    event_type = Column(String(100))
    document_name = Column(String(200), nullable=False)
    is_mandatory = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class EventAgreement(Base):
    __tablename__ = "event_agreements"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True, nullable=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("hcp_doctors.id"), nullable=True)
    non_mcl_name = Column(String(300))
    non_mcl_pan = Column(String(20))
    non_mcl_email = Column(String(200))
    is_hcp_doctor = Column(Boolean, default=True)
    agreement_date = Column(DateTime)
    status = Column(String(50), default="Pending")
    cancellation_remark = Column(Text)
    is_downloadable = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    event = relationship("Event", back_populates="agreements")
    doctor = relationship("HcpDoctor")
