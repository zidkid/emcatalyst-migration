from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal
from app.db.base import get_db
from app.models.promotional import PromotionalEvent, PromotionalApproval, PromotionalStatus
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/promotional", tags=["promotional"])


class PromoEventCreate(BaseModel):
    event_title: str
    event_type: Optional[str] = None
    month_and_year: Optional[datetime] = None
    division_id: Optional[int] = None
    territory: Optional[str] = None
    target_audience: Optional[str] = None
    objective: Optional[str] = None
    quantity: Optional[int] = None
    rate_per_qty: Optional[Decimal] = None
    total_budget: Optional[Decimal] = None
    remarks: Optional[str] = None


class PromoEventUpdate(BaseModel):
    event_title: Optional[str] = None
    status: Optional[PromotionalStatus] = None
    remarks: Optional[str] = None
    is_valid: Optional[bool] = None
    action: Optional[str] = None
    progress_value: Optional[int] = None


class PromoEventOut(BaseModel):
    id: int
    event_code: Optional[str]
    event_title: str
    event_type: Optional[str]
    month_and_year: Optional[datetime]
    status: PromotionalStatus
    total_budget: Optional[Decimal]
    actual_spend: Optional[Decimal]
    is_valid: bool
    created_at: datetime

    class Config:
        from_attributes = True


def gen_promo_code(db: Session) -> str:
    count = db.query(PromotionalEvent).count() + 1
    return f"PE{datetime.now().strftime('%Y%m')}{count:04d}"


@router.get("/", response_model=List[PromoEventOut])
def list_promo_events(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(PromotionalEvent)
    if status:
        q = q.filter(PromotionalEvent.status == status)
    return q.order_by(PromotionalEvent.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=PromoEventOut)
def create_promo_event(
    data: PromoEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    pe = PromotionalEvent(**data.model_dump(), initiator_id=current_user.id)
    pe.event_code = gen_promo_code(db)
    db.add(pe)
    db.commit()
    db.refresh(pe)
    return pe


@router.get("/{pe_id}", response_model=PromoEventOut)
def get_promo_event(pe_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    pe = db.query(PromotionalEvent).filter(PromotionalEvent.id == pe_id).first()
    if not pe:
        raise HTTPException(status_code=404, detail="Not found")
    return pe


@router.put("/{pe_id}", response_model=PromoEventOut)
def update_promo_event(pe_id: int, data: PromoEventUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    pe = db.query(PromotionalEvent).filter(PromotionalEvent.id == pe_id).first()
    if not pe:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pe, field, value)
    db.commit()
    db.refresh(pe)
    return pe


@router.post("/{pe_id}/approve")
def approve_promo(pe_id: int, remarks: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    pe = db.query(PromotionalEvent).filter(PromotionalEvent.id == pe_id).first()
    if not pe:
        raise HTTPException(status_code=404, detail="Not found")
    approval = PromotionalApproval(
        promo_event_id=pe_id,
        approver_id=current_user.id,
        approver_role=current_user.role.value,
        action="Approved",
        remarks=remarks
    )
    db.add(approval)
    pe.status = PromotionalStatus.APPROVED
    db.commit()
    return {"message": "Approved"}
