from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from app.db.base import get_db
from app.api.deps import require_admin
from app.models.master import (
    EventType, DocumentType, Designation, CompanyCode, Enumeration,
    HcpDoctor, FmvCriteria, MasterSpeciality, MasterHcpRole,
    MasterTherapeutic, MasterState,
    MasterBrand, MasterMeal, MasterCity, MasterSponsorshipType
)
from app.models.user import Division
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/master", tags=["master-data"])


class EventTypeOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    max_fmv: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True


class EnumerationOut(BaseModel):
    id: int
    category: str
    code: str
    label: str
    sort_order: int

    class Config:
        from_attributes = True


class HcpDoctorOut(BaseModel):
    id: int
    mendix_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    qualification: Optional[str] = None
    email: Optional[str] = None
    pan_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    mobile_number: Optional[str] = None
    doctor_type: Optional[str] = None
    hourly_rate: Optional[Decimal] = None
    max_capping: Optional[Decimal] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    name_as_per_bank: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class FmvCriteriaOut(BaseModel):
    id: int
    mendix_id: Optional[str] = None
    clinical_practice_experience: Optional[str] = None
    investigator_experience: Optional[str] = None
    expertise: Optional[str] = None
    professional_position: Optional[str] = None
    congress_experience: Optional[str] = None
    publications: Optional[str] = None

    class Config:
        from_attributes = True


class MasterItemOut(BaseModel):
    id: int
    mendix_id: Optional[str] = None
    name: str
    is_active: bool = True

    class Config:
        from_attributes = True


class DivisionOut(BaseModel):
    id: int
    mendix_id: Optional[str] = None
    name: str
    code: Optional[str] = None
    cluster: Optional[str] = None
    costcenter: Optional[str] = None
    profitcenter: Optional[str] = None
    eventcodeprefix: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


@router.get("/event-types", response_model=List[EventTypeOut])
def list_event_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(EventType).filter(EventType.is_active == True).all()


@router.get("/document-types")
def list_document_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(DocumentType).filter(DocumentType.is_active == True).all()


@router.get("/designations")
def list_designations(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Designation).filter(Designation.is_active == True).all()


@router.get("/company-codes")
def list_company_codes(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(CompanyCode).filter(CompanyCode.is_active == True).all()


@router.get("/enumerations/{category}", response_model=List[EnumerationOut])
def list_enumerations(
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Enumeration).filter(
        Enumeration.category == category,
        Enumeration.is_active == True
    ).order_by(Enumeration.sort_order).all()


@router.get("/divisions", response_model=List[DivisionOut])
def list_divisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Division).filter(Division.is_active == True).order_by(Division.name).all()


@router.get("/hcp-doctors", response_model=List[HcpDoctorOut])
def search_hcp_doctors(
    q: Optional[str] = Query(None, description="Search by name, pan, email, city"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(HcpDoctor).filter(HcpDoctor.is_active == True)
    if q:
        like = f"%{q}%"
        from sqlalchemy import or_
        query = query.filter(or_(
            HcpDoctor.full_name.ilike(like),
            HcpDoctor.first_name.ilike(like),
            HcpDoctor.last_name.ilike(like),
            HcpDoctor.pan_number.ilike(like),
            HcpDoctor.email.ilike(like),
            HcpDoctor.city.ilike(like),
        ))
    return query.order_by(HcpDoctor.full_name).limit(limit).all()


@router.get("/hcp-doctors/{doctor_id}", response_model=HcpDoctorOut)
def get_hcp_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doctor = db.query(HcpDoctor).filter(HcpDoctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.get("/fmv-criteria", response_model=List[FmvCriteriaOut])
def list_fmv_criteria(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(FmvCriteria).filter(FmvCriteria.is_active == True).all()


@router.get("/specialities", response_model=List[MasterItemOut])
def list_specialities(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(MasterSpeciality).filter(MasterSpeciality.is_active == True).order_by(MasterSpeciality.name).all()


@router.get("/hcp-roles", response_model=List[MasterItemOut])
def list_hcp_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(MasterHcpRole).filter(MasterHcpRole.is_active == True).all()


@router.get("/therapeutics", response_model=List[MasterItemOut])
def list_therapeutics(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(MasterTherapeutic).filter(MasterTherapeutic.is_active == True).order_by(MasterTherapeutic.name).all()


@router.get("/states", response_model=List[MasterItemOut])
def list_states(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(MasterState).filter(MasterState.is_active == True).order_by(MasterState.name).all()


# --- Brands ---

class BrandOut(BaseModel):
    id: int
    mendix_id: Optional[str] = None
    name: str
    therapeutic_area: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


@router.get("/brands", response_model=List[BrandOut])
def list_brands(
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(MasterBrand).filter(MasterBrand.is_active == True)
    if q:
        query = query.filter(MasterBrand.name.ilike(f"%{q}%"))
    return query.order_by(MasterBrand.name).all()


@router.post("/brands", response_model=BrandOut)
def create_brand(
    name: str,
    therapeutic_area: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    brand = MasterBrand(name=name, therapeutic_area=therapeutic_area)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.put("/brands/{brand_id}", response_model=BrandOut)
def update_brand(
    brand_id: int,
    name: Optional[str] = None,
    therapeutic_area: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    brand = db.query(MasterBrand).filter(MasterBrand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if name is not None:
        brand.name = name
    if therapeutic_area is not None:
        brand.therapeutic_area = therapeutic_area
    if is_active is not None:
        brand.is_active = is_active
    db.commit()
    db.refresh(brand)
    return brand


# --- Meals ---

@router.get("/meals", response_model=List[MasterItemOut])
def list_meals(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(MasterMeal).filter(MasterMeal.is_active == True).order_by(MasterMeal.name).all()


@router.post("/meals", response_model=MasterItemOut)
def create_meal(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    meal = MasterMeal(name=name)
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.put("/meals/{meal_id}", response_model=MasterItemOut)
def update_meal(
    meal_id: int,
    name: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    meal = db.query(MasterMeal).filter(MasterMeal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    if name is not None:
        meal.name = name
    if is_active is not None:
        meal.is_active = is_active
    db.commit()
    db.refresh(meal)
    return meal


# --- Cities ---

class CityOut(BaseModel):
    id: int
    name: str
    state: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


@router.get("/cities", response_model=List[CityOut])
def list_cities(
    q: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(MasterCity).filter(MasterCity.is_active == True)
    if q:
        query = query.filter(MasterCity.name.ilike(f"%{q}%"))
    if state:
        query = query.filter(MasterCity.state == state)
    return query.order_by(MasterCity.name).all()


@router.post("/cities", response_model=CityOut)
def create_city(
    name: str,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    city = MasterCity(name=name, state=state)
    db.add(city)
    db.commit()
    db.refresh(city)
    return city


@router.put("/cities/{city_id}", response_model=CityOut)
def update_city(
    city_id: int,
    name: Optional[str] = None,
    state: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    city = db.query(MasterCity).filter(MasterCity.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    if name is not None:
        city.name = name
    if state is not None:
        city.state = state
    if is_active is not None:
        city.is_active = is_active
    db.commit()
    db.refresh(city)
    return city


# --- Sponsorship Types ---

class SponsorshipTypeOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


@router.get("/sponsorship-types", response_model=List[SponsorshipTypeOut])
def list_sponsorship_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(MasterSponsorshipType).filter(MasterSponsorshipType.is_active == True).all()


@router.post("/sponsorship-types", response_model=SponsorshipTypeOut)
def create_sponsorship_type(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    st = MasterSponsorshipType(name=name, description=description)
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@router.put("/sponsorship-types/{st_id}", response_model=SponsorshipTypeOut)
def update_sponsorship_type(
    st_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    st = db.query(MasterSponsorshipType).filter(MasterSponsorshipType.id == st_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Sponsorship type not found")
    if name is not None:
        st.name = name
    if description is not None:
        st.description = description
    if is_active is not None:
        st.is_active = is_active
    db.commit()
    db.refresh(st)
    return st


# --- Document Types (CRUD for admin) ---

class DocumentTypeOut(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    is_mandatory: bool = False
    is_active: bool = True

    class Config:
        from_attributes = True


@router.get("/document-types-full", response_model=List[DocumentTypeOut])
def list_document_types_full(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(DocumentType).order_by(DocumentType.name).all()


@router.post("/document-types", response_model=DocumentTypeOut)
def create_document_type(
    name: str,
    code: Optional[str] = None,
    is_mandatory: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if code and db.query(DocumentType).filter(DocumentType.code == code).first():
        raise HTTPException(status_code=400, detail="Code already exists")
    dt = DocumentType(name=name, code=code, is_mandatory=is_mandatory)
    db.add(dt)
    db.commit()
    db.refresh(dt)
    return dt


@router.put("/document-types/{dt_id}", response_model=DocumentTypeOut)
def update_document_type(
    dt_id: int,
    name: Optional[str] = None,
    is_mandatory: Optional[bool] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    dt = db.query(DocumentType).filter(DocumentType.id == dt_id).first()
    if not dt:
        raise HTTPException(status_code=404, detail="Document type not found")
    if name is not None:
        dt.name = name
    if is_mandatory is not None:
        dt.is_mandatory = is_mandatory
    if is_active is not None:
        dt.is_active = is_active
    db.commit()
    db.refresh(dt)
    return dt


# --- HCP Doctors full list (for Masters page) ---

@router.get("/hcp-doctors-all", response_model=List[HcpDoctorOut])
def list_all_hcp_doctors(
    q: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(HcpDoctor)
    if q:
        from sqlalchemy import or_
        like = f"%{q}%"
        query = query.filter(or_(
            HcpDoctor.full_name.ilike(like),
            HcpDoctor.pan_number.ilike(like),
            HcpDoctor.email.ilike(like),
            HcpDoctor.city.ilike(like),
            HcpDoctor.mobile_number.ilike(like),
        ))
    if state:
        query = query.filter(HcpDoctor.state == state)
    total = query.count()
    doctors = query.order_by(HcpDoctor.full_name).offset(skip).limit(limit).all()
    return doctors
