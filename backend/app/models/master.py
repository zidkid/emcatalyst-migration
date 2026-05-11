from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric
from sqlalchemy.sql import func
from app.db.base import Base


class CompanyCode(Base):
    __tablename__ = "company_codes"

    id = Column(Integer, primary_key=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(200))
    country = Column(String(10))
    currency = Column(String(10))
    is_active = Column(Boolean, default=True)


class MasterDivision(Base):
    __tablename__ = "master_divisions"

    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True)
    name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)


class Designation(Base):
    __tablename__ = "designations"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), unique=True, nullable=False)
    grade = Column(String(20))
    is_active = Column(Boolean, default=True)


class EventType(Base):
    __tablename__ = "event_types"

    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    max_fmv = Column(Integer)
    is_active = Column(Boolean, default=True)


class DocumentType(Base):
    __tablename__ = "document_types"

    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True)
    name = Column(String(200), nullable=False)
    is_mandatory = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class Enumeration(Base):
    __tablename__ = "enumerations"

    id = Column(Integer, primary_key=True)
    category = Column(String(100), nullable=False, index=True)
    code = Column(String(50), nullable=False)
    label = Column(String(200), nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class HcpDoctor(Base):
    __tablename__ = "hcp_doctors"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True, index=True)
    first_name = Column(String(200))
    middle_name = Column(String(200))
    last_name = Column(String(200))
    full_name = Column(String(200))
    qualification = Column(String(200))
    email = Column(String(200))
    experience = Column(String(200))
    uid_number = Column(String(200))
    address = Column(String(200))
    pan_number = Column(String(200))
    city = Column(String(200))
    state = Column(String(50))
    pincode = Column(String(10))
    degree = Column(String(50))
    diploma = Column(String(50))
    gender = Column(String(6))
    mci_reg_number = Column(String(50))
    is_registered_under_gst = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_draft = Column(Boolean, default=False)
    sbu_code = Column(String(200))
    mobile_number = Column(String(20))
    doctor_type = Column(String(20))
    doctor_class = Column(String(1))
    hml = Column(String(1))
    name_as_per_bank = Column(String(70))
    bank_name = Column(String(50))
    account_number = Column(String(25))
    bank_branch = Column(String(30))
    ifsc_code = Column(String(50))
    hourly_rate = Column(Numeric(12, 2))
    max_capping = Column(Numeric(12, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FmvCriteria(Base):
    __tablename__ = "fmv_criteria"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True)
    clinical_practice_experience = Column(String(34))
    investigator_experience = Column(String(50))
    expertise = Column(String(21))
    professional_position = Column(String(75))
    congress_experience = Column(String(101))
    publications = Column(String(78))
    is_active = Column(Boolean, default=True)


class MasterSpeciality(Base):
    __tablename__ = "master_specialities"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True)
    name = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)


class MasterHcpRole(Base):
    __tablename__ = "master_hcp_roles"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True)
    name = Column(String(40), nullable=False)
    is_active = Column(Boolean, default=True)


class MasterTherapeutic(Base):
    __tablename__ = "master_therapeutics"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True)
    name = Column(String(40), nullable=False)
    is_active = Column(Boolean, default=True)


class MasterState(Base):
    __tablename__ = "master_states"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True)
    name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)


class MasterBrand(Base):
    __tablename__ = "master_brands"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True)
    name = Column(String(200), nullable=False)
    therapeutic_area = Column(String(200))
    is_active = Column(Boolean, default=True)


class MasterMeal(Base):
    __tablename__ = "master_meals"

    id = Column(Integer, primary_key=True, index=True)
    mendix_id = Column(String(30), unique=True)
    name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)


class MasterCity(Base):
    __tablename__ = "master_cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    state = Column(String(200))
    is_active = Column(Boolean, default=True)


class MasterSponsorshipType(Base):
    __tablename__ = "master_sponsorship_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
