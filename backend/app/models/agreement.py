from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class AgreementStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    ACTIVE = "Active"
    EXPIRED = "Expired"
    TERMINATED = "Terminated"


class Agreement(Base):
    __tablename__ = "agreements"

    id = Column(Integer, primary_key=True, index=True)
    agreement_no = Column(String(50), unique=True, index=True)
    title = Column(String(500), nullable=False)
    agreement_type = Column(String(100))
    party_name = Column(String(300))
    party_contact = Column(String(200))
    party_email = Column(String(200))
    party_address = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    value = Column(Numeric(15, 2))
    currency = Column(String(10), default="INR")
    payment_terms = Column(String(200))
    status = Column(Enum(AgreementStatus), default=AgreementStatus.DRAFT)
    description = Column(Text)
    terms_conditions = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=True)
    renewal_required = Column(Boolean, default=False)
    auto_renew = Column(Boolean, default=False)
    renewal_notice_days = Column(Integer, default=30)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    documents = relationship("AgreementDocument", back_populates="agreement")


class AgreementDocument(Base):
    __tablename__ = "agreement_documents"

    id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("agreements.id"), nullable=False)
    document_name = Column(String(300))
    document_type = Column(String(100))
    file_path = Column(String(500))
    file_size = Column(Integer)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    agreement = relationship("Agreement", back_populates="documents")
    uploaded_by = relationship("User")
