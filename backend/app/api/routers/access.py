from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from typing import Optional
from app.db.base import get_db
from app.models.user import Division, CostCenter, Function, Territory, UserGroup
from app.api.deps import get_current_active_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/access", tags=["access-management"])


class DivisionOut(BaseModel):
    id: int
    name: str
    code: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class CostCenterOut(BaseModel):
    id: int
    cost_center_id: str
    name: str
    division_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


class FunctionOut(BaseModel):
    id: int
    name: str
    code: Optional[str]

    class Config:
        from_attributes = True


@router.get("/divisions", response_model=List[DivisionOut])
def list_divisions(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Division).filter(Division.is_active == True).all()


@router.post("/divisions", response_model=DivisionOut)
def create_division(name: str, code: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    div = Division(name=name, code=code)
    db.add(div)
    db.commit()
    db.refresh(div)
    return div


@router.get("/cost-centers", response_model=List[CostCenterOut])
def list_cost_centers(
    division_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(CostCenter).filter(CostCenter.is_active == True)
    if division_id:
        q = q.filter(CostCenter.division_id == division_id)
    return q.all()


@router.post("/cost-centers", response_model=CostCenterOut)
def create_cost_center(
    cost_center_id: str, name: str,
    division_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    cc = CostCenter(cost_center_id=cost_center_id, name=name, division_id=division_id)
    db.add(cc)
    db.commit()
    db.refresh(cc)
    return cc


@router.get("/functions", response_model=List[FunctionOut])
def list_functions(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Function).filter(Function.is_active == True).all()
