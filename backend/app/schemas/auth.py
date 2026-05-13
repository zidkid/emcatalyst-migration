from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole
    roles: list = []  # Multiple roles
    is_active: bool
    employee_id: Optional[str] = None
    designation_title: Optional[str] = None
    division_id: Optional[int] = None
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    department: Optional[str] = None
    business_unit: Optional[str] = None
    job_level: Optional[str] = None
    office_state: Optional[str] = None
    office_city: Optional[str] = None
    gender: Optional[str] = None
    office_mobile_no: Optional[str] = None
    mendix_id: Optional[str] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    employee_id: Optional[str] = None
    role: UserRole = UserRole.USER
    division_id: Optional[int] = None
    designation_title: Optional[str] = None
    manager_id: Optional[int] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    designation_title: Optional[str] = None
    division_id: Optional[int] = None
    cost_center_id: Optional[int] = None
    manager_id: Optional[int] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    office_mobile_no: Optional[str] = None
    personal_mobile_no: Optional[str] = None
    location: Optional[str] = None
    region: Optional[str] = None
    zone: Optional[str] = None
