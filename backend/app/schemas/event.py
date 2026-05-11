from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.event import EventStatus


class EventDoctorBase(BaseModel):
    doctor_name: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    institute: Optional[str] = None
    city: Optional[str] = None
    mobile_no: Optional[str] = None
    email: Optional[str] = None
    pan_number: Optional[str] = None
    gstin: Optional[str] = None
    role: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    ifsc_code: Optional[str] = None
    fmv_amount: Optional[Decimal] = None


class EventDoctorCreate(EventDoctorBase):
    pass


class EventDoctorOut(EventDoctorBase):
    id: int
    event_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EventCostBase(BaseModel):
    cost_head: str
    cost_category: Optional[str] = None
    vendor_name: Optional[str] = None
    estimated_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    currency: str = "INR"
    gst_applicable: bool = False
    gst_rate: Optional[Decimal] = None
    remarks: Optional[str] = None


class EventCostCreate(EventCostBase):
    pass


class EventCostOut(EventCostBase):
    id: int
    event_id: int

    class Config:
        from_attributes = True


class EventBase(BaseModel):
    event_title: str
    event_type: Optional[str] = None
    event_category: Optional[str] = None
    event_date: Optional[datetime] = None
    event_end_date: Optional[datetime] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    expected_attendance: Optional[int] = None
    division_id: Optional[int] = None
    company_code: Optional[str] = None
    cost_center: Optional[str] = None
    budget_amount: Optional[Decimal] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    event_title: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[datetime] = None
    event_end_date: Optional[datetime] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    expected_attendance: Optional[int] = None
    budget_amount: Optional[Decimal] = None
    status: Optional[EventStatus] = None
    compliance_remarks: Optional[str] = None
    finance_remarks: Optional[str] = None
    rejection_reason: Optional[str] = None
    step: Optional[int] = None


class EventOut(EventBase):
    id: int
    event_code: Optional[str]
    status: EventStatus
    initiator_id: int
    step: int
    actual_amount: Optional[Decimal]
    created_at: datetime
    updated_at: Optional[datetime]
    doctors: List[EventDoctorOut] = []
    costs: List[EventCostOut] = []

    class Config:
        from_attributes = True
