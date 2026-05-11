from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.base import get_db
from app.models.vendor import Vendor, VendorBankDetail
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorOut, VendorBankDetailCreate, VendorBankDetailOut
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/vendors", tags=["vendors"])


@router.get("/", response_model=List[VendorOut])
def list_vendors(
    skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Vendor)
    if search:
        q = q.filter(
            (Vendor.lifnr.ilike(f"%{search}%")) |
            (Vendor.name1.ilike(f"%{search}%")) |
            (Vendor.pan_no.ilike(f"%{search}%"))
        )
    return q.order_by(Vendor.name1).offset(skip).limit(limit).all()


@router.post("/", response_model=VendorOut)
def create_vendor(
    data: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if db.query(Vendor).filter(Vendor.lifnr == data.lifnr).first():
        raise HTTPException(status_code=400, detail="Vendor LIFNR already exists")
    vendor = Vendor(**data.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/{vendor_id}", response_model=VendorOut)
def update_vendor(
    vendor_id: int,
    data: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.post("/{vendor_id}/bank-details", response_model=VendorBankDetailOut)
def add_bank_detail(
    vendor_id: int,
    data: VendorBankDetailCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not db.query(Vendor).filter(Vendor.id == vendor_id).first():
        raise HTTPException(status_code=404, detail="Vendor not found")
    bd = VendorBankDetail(**data.model_dump(), vendor_id=vendor_id)
    db.add(bd)
    db.commit()
    db.refresh(bd)
    return bd
