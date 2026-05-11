from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import os, shutil, uuid
from pydantic import BaseModel
from app.db.base import get_db
from app.models.event import Event, EventDoctor, EventCost, EventDocument, EventHonorarium, EventStatus, EventAgreement
from app.models.master import HcpDoctor
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventOut, EventDoctorCreate, EventDoctorOut, EventCostCreate, EventCostOut
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/events", tags=["events"])

UPLOAD_DIR = "uploads/events"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_event_code(db: Session) -> str:
    count = db.query(Event).count() + 1
    return f"EC{datetime.now().strftime('%Y%m')}{count:04d}"


@router.get("/", response_model=List[EventOut])
def list_events(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    division_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Event)
    if status:
        q = q.filter(Event.status == status)
    if division_id:
        q = q.filter(Event.division_id == division_id)
    return q.order_by(Event.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=EventOut)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = Event(**data.model_dump(), initiator_id=current_user.id, step=1)
    event.event_code = generate_event_code(db)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/submit", response_model=EventOut)
def submit_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != EventStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft events can be submitted")
    event.status = EventStatus.SUBMITTED
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/approve", response_model=EventOut)
def approve_event(
    event_id: int,
    remarks: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = EventStatus.APPROVED
    event.approver_id = current_user.id
    if remarks:
        event.compliance_remarks = remarks
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/reject", response_model=EventOut)
def reject_event(
    event_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = EventStatus.REJECTED
    event.rejection_reason = reason
    db.commit()
    db.refresh(event)
    return event


# Doctors
@router.get("/{event_id}/doctors", response_model=List[EventDoctorOut])
def list_doctors(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(EventDoctor).filter(EventDoctor.event_id == event_id).all()


@router.post("/{event_id}/doctors", response_model=EventDoctorOut)
def add_doctor(event_id: int, data: EventDoctorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not db.query(Event).filter(Event.id == event_id).first():
        raise HTTPException(status_code=404, detail="Event not found")
    doctor = EventDoctor(**data.model_dump(), event_id=event_id)
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{event_id}/doctors/{doctor_id}")
def remove_doctor(event_id: int, doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    doctor = db.query(EventDoctor).filter(EventDoctor.id == doctor_id, EventDoctor.event_id == event_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
    return {"message": "Removed"}


# Costs
@router.get("/{event_id}/costs", response_model=List[EventCostOut])
def list_costs(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(EventCost).filter(EventCost.event_id == event_id).all()


@router.post("/{event_id}/costs", response_model=EventCostOut)
def add_cost(event_id: int, data: EventCostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    cost = EventCost(**data.model_dump(), event_id=event_id)
    db.add(cost)
    db.commit()
    db.refresh(cost)
    return cost


# Documents upload
@router.post("/{event_id}/documents")
async def upload_document(
    event_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not db.query(Event).filter(Event.id == event_id).first():
        raise HTTPException(status_code=404, detail="Event not found")
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, str(event_id), file_name)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    doc = EventDocument(
        event_id=event_id,
        document_type=document_type,
        document_name=file.filename,
        file_path=file_path,
        mime_type=file.content_type,
        uploaded_by_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "document_name": doc.document_name, "file_path": doc.file_path}


# Agreements (sub-module of Event)

class AgreementCreate(BaseModel):
    doctor_id: Optional[int] = None
    non_mcl_name: Optional[str] = None
    non_mcl_pan: Optional[str] = None
    non_mcl_email: Optional[str] = None
    is_hcp_doctor: bool = True
    agreement_date: Optional[datetime] = None


class AgreementOut(BaseModel):
    id: int
    event_id: int
    doctor_id: Optional[int] = None
    non_mcl_name: Optional[str] = None
    non_mcl_pan: Optional[str] = None
    non_mcl_email: Optional[str] = None
    is_hcp_doctor: bool
    agreement_date: Optional[datetime] = None
    status: str
    cancellation_remark: Optional[str] = None
    is_downloadable: bool
    doctor_name: Optional[str] = None
    doctor_pan: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/{event_id}/agreements")
def list_agreements(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    agreements = db.query(EventAgreement).filter(EventAgreement.event_id == event_id).all()
    result = []
    for ag in agreements:
        item = {
            "id": ag.id,
            "event_id": ag.event_id,
            "doctor_id": ag.doctor_id,
            "non_mcl_name": ag.non_mcl_name,
            "non_mcl_pan": ag.non_mcl_pan,
            "non_mcl_email": ag.non_mcl_email,
            "is_hcp_doctor": ag.is_hcp_doctor,
            "agreement_date": ag.agreement_date,
            "status": ag.status,
            "cancellation_remark": ag.cancellation_remark,
            "is_downloadable": ag.is_downloadable,
            "doctor_name": None,
            "doctor_pan": None,
        }
        if ag.doctor_id:
            doc = db.query(HcpDoctor).filter(HcpDoctor.id == ag.doctor_id).first()
            if doc:
                item["doctor_name"] = doc.full_name or f"{doc.first_name or ''} {doc.last_name or ''}".strip()
                item["doctor_pan"] = doc.pan_number
        result.append(item)
    return result


@router.post("/{event_id}/agreements")
def create_agreement(
    event_id: int,
    data: AgreementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not db.query(Event).filter(Event.id == event_id).first():
        raise HTTPException(status_code=404, detail="Event not found")
    ag = EventAgreement(
        event_id=event_id,
        doctor_id=data.doctor_id,
        non_mcl_name=data.non_mcl_name,
        non_mcl_pan=data.non_mcl_pan,
        non_mcl_email=data.non_mcl_email,
        is_hcp_doctor=data.is_hcp_doctor,
        agreement_date=data.agreement_date,
        status="Pending",
    )
    db.add(ag)
    db.commit()
    db.refresh(ag)
    return {"id": ag.id, "status": ag.status}


@router.put("/{event_id}/agreements/{agreement_id}/status")
def update_agreement_status(
    event_id: int,
    agreement_id: int,
    status: str,
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ag = db.query(EventAgreement).filter(
        EventAgreement.id == agreement_id,
        EventAgreement.event_id == event_id
    ).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    ag.status = status
    if remark:
        ag.cancellation_remark = remark
    if status == "Approved":
        ag.is_downloadable = True
    db.commit()
    return {"id": ag.id, "status": ag.status}


@router.delete("/{event_id}/agreements/{agreement_id}")
def delete_agreement(
    event_id: int,
    agreement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ag = db.query(EventAgreement).filter(
        EventAgreement.id == agreement_id,
        EventAgreement.event_id == event_id
    ).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    db.delete(ag)
    db.commit()
    return {"message": "Deleted"}
