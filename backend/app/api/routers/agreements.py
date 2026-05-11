from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.db.base import get_db
from app.models.agreement import Agreement, AgreementStatus
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/agreements", tags=["agreements"])


class AgreementCreate(BaseModel):
    title: str
    agreement_type: Optional[str] = None
    party_name: Optional[str] = None
    party_email: Optional[str] = None
    party_contact: Optional[str] = None
    party_address: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    value: Optional[float] = None
    currency: str = "INR"
    payment_terms: Optional[str] = None
    description: Optional[str] = None
    division_id: Optional[int] = None


class AgreementUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[AgreementStatus] = None
    party_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    value: Optional[float] = None
    description: Optional[str] = None


class AgreementOut(BaseModel):
    id: int
    agreement_no: Optional[str]
    title: str
    agreement_type: Optional[str]
    party_name: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    value: Optional[float]
    currency: str
    status: AgreementStatus
    created_at: datetime

    class Config:
        from_attributes = True


def gen_agreement_no(db: Session) -> str:
    count = db.query(Agreement).count() + 1
    return f"AGR{datetime.now().year}{count:04d}"


@router.get("/", response_model=List[AgreementOut])
def list_agreements(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Agreement)
    if status:
        q = q.filter(Agreement.status == status)
    return q.order_by(Agreement.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=AgreementOut)
def create_agreement(
    data: AgreementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ag = Agreement(**data.model_dump(), created_by_id=current_user.id)
    ag.agreement_no = gen_agreement_no(db)
    db.add(ag)
    db.commit()
    db.refresh(ag)
    return ag


@router.get("/{agreement_id}", response_model=AgreementOut)
def get_agreement(agreement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return ag


@router.put("/{agreement_id}", response_model=AgreementOut)
def update_agreement(agreement_id: int, data: AgreementUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ag, field, value)
    db.commit()
    db.refresh(ag)
    return ag


@router.post("/{agreement_id}/approve", response_model=AgreementOut)
def approve_agreement(agreement_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ag = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agreement not found")
    ag.status = AgreementStatus.APPROVED
    ag.approved_by_id = current_user.id
    db.commit()
    db.refresh(ag)
    return ag
