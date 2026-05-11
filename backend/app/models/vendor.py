from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    lifnr = Column(String(20), unique=True, index=True, nullable=False)  # SAP vendor ID
    name1 = Column(String(200))
    name2 = Column(String(200))
    land1 = Column(String(10))   # Country
    ort01 = Column(String(100))  # City
    pstlz = Column(String(20))   # Postal code
    stras = Column(String(200))  # Street
    adrnr = Column(String(20))   # Address number
    ktokk = Column(String(10))   # Account group
    j_1ipanno = Column(String(20))  # PAN number
    zterm = Column(String(10))   # Payment terms
    erdat = Column(DateTime)     # Creation date
    ernam = Column(String(50))   # Created by
    pan_no = Column(String(20))
    tax_no = Column(String(30))
    gstin = Column(String(20))
    vendor_type = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    bank_details = relationship("VendorBankDetail", back_populates="vendor")
    withholding_taxes = relationship("VendorWithholding", back_populates="vendor")
    invoices = relationship("VendorInvoice", back_populates="vendor")


class VendorBankDetail(Base):
    __tablename__ = "vendor_bank_details"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    bankl = Column(String(20))   # Bank key
    bankn = Column(String(30))   # Bank account number
    bank_name = Column(String(200))
    ifsc_code = Column(String(20))
    account_type = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="bank_details")


class VendorWithholding(Base):
    __tablename__ = "vendor_withholding"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    witht = Column(String(10))       # Withholding tax type
    qsrec = Column(String(10))       # Recipient type
    wtwtstcd = Column(String(10))    # Withholding tax code
    wtexnr = Column(String(20))      # Exemption certificate
    wtexrt = Column(Numeric(10, 4))  # Exemption rate
    wtexdf = Column(DateTime)        # Exemption valid from
    companycode = Column(String(10))
    wtexdt = Column(DateTime)        # Exemption valid to
    wtwithcd = Column(String(10))    # W/tax code
    wtsubjct = Column(String(50))    # Subject to withholding tax
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="withholding_taxes")
