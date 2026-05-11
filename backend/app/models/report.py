from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class EventReport(Base):
    __tablename__ = "event_reports"

    id = Column(Integer, primary_key=True, index=True)
    event_code = Column(String(50), index=True)
    event_title = Column(String(500))
    event_type = Column(String(100))
    event_date = Column(DateTime)
    division = Column(String(100))
    location = Column(String(200))
    initiator = Column(String(200))
    status = Column(String(50))
    budget_amount = Column(Numeric(15, 2))
    actual_amount = Column(Numeric(15, 2))
    doctor_count = Column(Integer)
    attendance = Column(Integer)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    generated_by = relationship("User")


class FinanceAllocationReport(Base):
    __tablename__ = "finance_allocation_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_period = Column(String(20))
    division = Column(String(100))
    cost_center = Column(String(20))
    event_code = Column(String(50))
    event_type = Column(String(100))
    gl_account = Column(String(20))
    amount = Column(Numeric(15, 2))
    currency = Column(String(10), default="INR")
    sap_doc_no = Column(String(30))
    posting_date = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CMEEventReport(Base):
    __tablename__ = "cme_event_reports"

    id = Column(Integer, primary_key=True, index=True)
    event_code = Column(String(50), index=True)
    event_title = Column(String(500))
    event_date = Column(DateTime)
    event_type = Column(String(100))
    division = Column(String(100))
    location = Column(String(200))
    doctor_name = Column(String(300))
    specialization = Column(String(200))
    honorarium = Column(Numeric(12, 2))
    tds_deducted = Column(Numeric(12, 2))
    net_paid = Column(Numeric(12, 2))
    payment_status = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DeviationReport(Base):
    __tablename__ = "deviation_reports"

    id = Column(Integer, primary_key=True, index=True)
    event_code = Column(String(50))
    deviation_type = Column(String(100))
    description = Column(Text)
    budget_amount = Column(Numeric(12, 2))
    actual_amount = Column(Numeric(12, 2))
    deviation_amount = Column(Numeric(12, 2))
    deviation_percent = Column(Numeric(5, 2))
    justification = Column(Text)
    status = Column(String(50))
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    raised_by = relationship("User")


class AuditHistory(Base):
    __tablename__ = "audit_history"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False)
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(50))
    remarks = Column(Text)

    changed_by = relationship("User")
