from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, String
from typing import Optional
from datetime import datetime
from app.db.base import get_db
from app.models.event import Event, EventStatus
from app.models.approval import VendorInvoice, InvoiceStatus
from app.models.agreement import Agreement
from app.models.report import AuditHistory
from app.models.promotional import PromotionalEvent
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    total_events = db.query(Event).count()
    pending_events = db.query(Event).filter(Event.status == EventStatus.SUBMITTED).count()
    approved_events = db.query(Event).filter(Event.status == EventStatus.APPROVED).count()
    total_invoices = db.query(VendorInvoice).count()
    pending_invoices = db.query(VendorInvoice).filter(VendorInvoice.status == InvoiceStatus.PENDING).count()
    total_agreements = db.query(Agreement).count()
    total_promo = db.query(PromotionalEvent).count()

    return {
        "events": {
            "total": total_events,
            "pending": pending_events,
            "approved": approved_events,
        },
        "invoices": {
            "total": total_invoices,
            "pending": pending_invoices,
        },
        "agreements": {"total": total_agreements},
        "promotional": {"total": total_promo},
    }


@router.get("/events")
def events_report(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    division_id: Optional[int] = None,
    status: Optional[str] = None,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Event)
    if from_date:
        q = q.filter(Event.event_date >= from_date)
    if to_date:
        q = q.filter(Event.event_date <= to_date)
    if division_id:
        q = q.filter(Event.division_id == division_id)
    if status:
        q = q.filter(Event.status == status)
    if event_type:
        q = q.filter(Event.event_type == event_type)
    events = q.all()
    return [
        {
            "id": e.id,
            "event_code": e.event_code,
            "event_title": e.event_title,
            "event_type": e.event_type,
            "event_date": e.event_date,
            "status": e.status,
            "budget_amount": float(e.budget_amount or 0),
            "actual_amount": float(e.actual_amount or 0),
        }
        for e in events
    ]


@router.get("/finance-allocation")
def finance_allocation_report(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(VendorInvoice)
    if from_date:
        q = q.filter(VendorInvoice.posting_date >= from_date)
    if to_date:
        q = q.filter(VendorInvoice.posting_date <= to_date)
    invoices = q.all()
    return [
        {
            "serial_no": inv.serial_no,
            "vendor_code": inv.vendor_code,
            "vendor_name": inv.vendor_name,
            "document_date": inv.document_date,
            "amount": float(inv.vendor_amount or 0),
            "igst": float(inv.igst_amount or 0),
            "cgst": float(inv.cgst_amount or 0),
            "sgst": float(inv.sgst_amount or 0),
            "tds": float(inv.tds_amount or 0),
            "net": float(inv.net_amount or 0),
            "status": inv.status,
            "sap_doc_no": inv.sap_doc_no,
        }
        for inv in invoices
    ]


@router.get("/audit-trail")
def audit_trail(
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(AuditHistory)
    if entity_type:
        q = q.filter(AuditHistory.entity_type == entity_type)
    if entity_id:
        q = q.filter(AuditHistory.entity_id == entity_id)
    return q.order_by(AuditHistory.changed_at.desc()).offset(skip).limit(limit).all()


@router.get("/cme-events")
def cme_report(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.models.event import EventHonorarium, EventDoctor
    q = db.query(EventHonorarium).join(Event, EventHonorarium.event_id == Event.id)
    if from_date:
        q = q.filter(Event.event_date >= from_date)
    if to_date:
        q = q.filter(Event.event_date <= to_date)
    records = q.all()
    return [
        {
            "event_id": r.event_id,
            "doctor_name": r.doctor_name,
            "session_type": r.session_type,
            "honorarium_amount": float(r.honorarium_amount or 0),
            "tds_amount": float(r.tds_amount or 0),
            "net_payable": float(r.net_payable or 0),
            "payment_status": r.payment_status,
        }
        for r in records
    ]


@router.get("/division-wise")
def division_wise_report(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.models.user import Division
    from sqlalchemy import func as sqlfunc
    q = db.query(
        Division.name.label("division_name"),
        sqlfunc.count(Event.id).label("event_count"),
        sqlfunc.sum(Event.budget_amount).label("total_budget"),
        sqlfunc.sum(Event.actual_amount).label("total_actual"),
        sqlfunc.count(Event.id).filter(Event.status == EventStatus.APPROVED).label("approved_count"),
        sqlfunc.count(Event.id).filter(Event.status == EventStatus.COMPLETED).label("completed_count"),
    ).outerjoin(Event, Event.division_id == Division.id)
    if from_date:
        q = q.filter((Event.event_date >= from_date) | (Event.id == None))
    if to_date:
        q = q.filter((Event.event_date <= to_date) | (Event.id == None))
    results = q.group_by(Division.id, Division.name).order_by(Division.name).all()
    return [
        {
            "division_name": r.division_name,
            "event_count": r.event_count or 0,
            "total_budget": float(r.total_budget or 0),
            "total_actual": float(r.total_actual or 0),
            "approved_count": r.approved_count or 0,
            "completed_count": r.completed_count or 0,
        }
        for r in results
    ]


@router.get("/hcp-honorarium")
def hcp_honorarium_report(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.models.event import EventAgreement
    from app.models.master import HcpDoctor
    q = db.query(
        EventAgreement, Event, HcpDoctor
    ).join(Event, EventAgreement.event_id == Event.id
    ).outerjoin(HcpDoctor, EventAgreement.doctor_id == HcpDoctor.id)
    if from_date:
        q = q.filter(Event.event_date >= from_date)
    if to_date:
        q = q.filter(Event.event_date <= to_date)
    results = q.all()
    return [
        {
            "event_code": e.event_code,
            "event_title": e.event_title,
            "event_date": e.event_date,
            "doctor_name": d.full_name if d else ag.non_mcl_name,
            "pan_number": d.pan_number if d else ag.non_mcl_pan,
            "is_mcl": ag.is_hcp_doctor,
            "status": ag.status,
            "hourly_rate": float(d.hourly_rate or 0) if d else 0,
            "max_capping": float(d.max_capping or 0) if d else 0,
        }
        for ag, e, d in results
    ]


@router.get("/state-wise")
def state_wise_report(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from sqlalchemy import func as sqlfunc
    q = db.query(
        Event.state.label("state"),
        sqlfunc.count(Event.id).label("event_count"),
        sqlfunc.sum(Event.budget_amount).label("total_budget"),
        sqlfunc.sum(Event.actual_amount).label("total_actual"),
    )
    if from_date:
        q = q.filter(Event.event_date >= from_date)
    if to_date:
        q = q.filter(Event.event_date <= to_date)
    results = q.filter(Event.state != None).group_by(Event.state).order_by(sqlfunc.count(Event.id).desc()).all()
    return [
        {
            "state": r.state,
            "event_count": r.event_count or 0,
            "total_budget": float(r.total_budget or 0),
            "total_actual": float(r.total_actual or 0),
        }
        for r in results
    ]


@router.get("/event-type-wise")
def event_type_report(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from sqlalchemy import func as sqlfunc
    q = db.query(
        Event.event_type.label("event_type"),
        sqlfunc.count(Event.id).label("event_count"),
        sqlfunc.sum(Event.budget_amount).label("total_budget"),
        sqlfunc.sum(Event.actual_amount).label("total_actual"),
    )
    if from_date:
        q = q.filter(Event.event_date >= from_date)
    if to_date:
        q = q.filter(Event.event_date <= to_date)
    results = q.filter(Event.event_type != None).group_by(Event.event_type).order_by(sqlfunc.count(Event.id).desc()).all()
    return [
        {
            "event_type": r.event_type,
            "event_count": r.event_count or 0,
            "total_budget": float(r.total_budget or 0),
            "total_actual": float(r.total_actual or 0),
        }
        for r in results
    ]
