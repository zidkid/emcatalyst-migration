from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class PromotionalStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    L1_APPROVED = "L1 Approved"
    COMPLIANCE_APPROVED = "Compliance Approved"
    FINANCE_APPROVED = "Finance Approved"
    PURCHASE_APPROVED = "Purchase Approved"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class PromotionalEvent(Base):
    __tablename__ = "promotional_events"

    id = Column(Integer, primary_key=True, index=True)
    event_code = Column(String(50), unique=True, index=True)
    event_title = Column(String(500), nullable=False)
    event_type = Column(String(100))
    month_and_year = Column(DateTime)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=True)
    territory = Column(String(100))
    target_audience = Column(String(200))
    objective = Column(Text)
    quantity = Column(Integer)
    rate_per_qty = Column(Numeric(10, 2))
    total_budget = Column(Numeric(15, 2))
    actual_spend = Column(Numeric(15, 2))
    is_valid = Column(Boolean, default=True)
    status = Column(Enum(PromotionalStatus), default=PromotionalStatus.DRAFT)
    action = Column(String(100))
    progress_value = Column(Integer, default=0)
    remarks = Column(Text)
    initiator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    initiator = relationship("User")
    approvals = relationship("PromotionalApproval", back_populates="promo_event")
    budgets = relationship("PromotionalBudget", back_populates="promo_event")


class PromotionalBudget(Base):
    __tablename__ = "promotional_budgets"

    id = Column(Integer, primary_key=True, index=True)
    promo_event_id = Column(Integer, ForeignKey("promotional_events.id"), nullable=False)
    cost_head = Column(String(200))
    quantity = Column(Numeric(10, 2))
    rate = Column(Numeric(10, 2))
    amount = Column(Numeric(12, 2))
    gst_rate = Column(Numeric(5, 2))
    gst_amount = Column(Numeric(12, 2))
    total_amount = Column(Numeric(12, 2))
    vendor_name = Column(String(300))

    promo_event = relationship("PromotionalEvent", back_populates="budgets")


class PromotionalApproval(Base):
    __tablename__ = "promotional_approvals"

    id = Column(Integer, primary_key=True, index=True)
    promo_event_id = Column(Integer, ForeignKey("promotional_events.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approver_role = Column(String(100))
    action = Column(String(50))
    remarks = Column(Text)
    action_date = Column(DateTime(timezone=True), server_default=func.now())

    promo_event = relationship("PromotionalEvent", back_populates="approvals")
    approver = relationship("User")
