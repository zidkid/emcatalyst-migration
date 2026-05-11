from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class VendorBankDetailBase(BaseModel):
    bankl: Optional[str] = None
    bankn: Optional[str] = None
    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_type: Optional[str] = None


class VendorBankDetailCreate(VendorBankDetailBase):
    pass


class VendorBankDetailOut(VendorBankDetailBase):
    id: int
    vendor_id: int

    class Config:
        from_attributes = True


class VendorBase(BaseModel):
    lifnr: str
    name1: Optional[str] = None
    name2: Optional[str] = None
    land1: Optional[str] = None
    ort01: Optional[str] = None
    pstlz: Optional[str] = None
    stras: Optional[str] = None
    ktokk: Optional[str] = None
    j_1ipanno: Optional[str] = None
    zterm: Optional[str] = None
    pan_no: Optional[str] = None
    tax_no: Optional[str] = None
    gstin: Optional[str] = None
    vendor_type: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name1: Optional[str] = None
    name2: Optional[str] = None
    gstin: Optional[str] = None
    pan_no: Optional[str] = None
    is_active: Optional[bool] = None


class VendorOut(VendorBase):
    id: int
    is_active: bool
    created_at: datetime
    bank_details: List[VendorBankDetailOut] = []

    class Config:
        from_attributes = True
