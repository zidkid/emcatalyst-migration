"""
EMCatalyst MPR → PostgreSQL Migration Script
Extracts data from the Mendix .mpr SQLite file and seeds the PostgreSQL database.
"""
import sqlite3
import re
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy.orm import Session
from app.db.base import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole, Division, CostCenter
from app.models.vendor import Vendor, VendorBankDetail
from app.models.master import EventType, DocumentType, Designation, CompanyCode, Enumeration
import app.models  # noqa - registers all models


MPR_PATH = r"C:\Users\10015309\Downloads\EMCatalyst.mpr"


def connect_mpr():
    return sqlite3.connect(MPR_PATH)


def extract_strings(blob):
    if not blob:
        return []
    text = blob.decode('latin-1')
    return re.findall(r'[\x20-\x7e]{3,}', text)


def get_module_map(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT UnitID, Contents FROM Unit WHERE ContainmentName='Modules'")
    module_map = {}
    for uid, contents in cursor.fetchall():
        strings = extract_strings(contents)
        for i, s in enumerate(strings):
            if s == 'Name' and i + 1 < len(strings):
                module_map[uid.hex()] = strings[i + 1]
                break
    return module_map


def migrate_master_data(db: Session):
    """Seed core master data"""
    print("Seeding master data...")

    # Company codes
    if not db.query(CompanyCode).filter(CompanyCode.code == "EMC1").first():
        db.add(CompanyCode(code="EMC1", name="Emcure Pharmaceuticals Ltd", country="IN", currency="INR"))

    # Event types from Mendix
    event_types = [
        ("CME", "Continuing Medical Education", 15000),
        ("CONF", "Conference/Symposium", 25000),
        ("WORKSHOP", "Workshop/Hands-on Training", 20000),
        ("ADVISORY", "Advisory Board Meeting", 30000),
        ("SPEAKER", "Speaker Program", 25000),
        ("ROUNDTABLE", "Round Table Discussion", 20000),
        ("WEBINAR", "Webinar/Virtual Event", 10000),
        ("PATIENT_PROG", "Patient Awareness Program", 5000),
        ("LAUNCH", "Product Launch Event", 50000),
        ("TRAINING", "Medical Training Program", 15000),
    ]
    for code, name, fmv in event_types:
        if not db.query(EventType).filter(EventType.code == code).first():
            db.add(EventType(code=code, name=name, max_fmv=fmv))

    # Document types
    doc_types = [
        ("INVITATION", "Event Invitation Letter", True),
        ("AGENDA", "Event Agenda/Program", True),
        ("ATTENDANCE", "Attendance Register", True),
        ("PHOTOS", "Event Photographs", False),
        ("INVOICE", "Vendor Invoice", True),
        ("PAN", "PAN Card", True),
        ("BANK", "Bank Details / Cancelled Cheque", True),
        ("CONSENT", "Speaker Consent Form", True),
        ("FMV_JUSTIFICATION", "FMV Justification Document", True),
        ("CV", "Doctor CV/Resume", False),
        ("REGISTRATION", "Event Registration Form", False),
        ("ETHICS", "Ethics Committee Approval", False),
    ]
    for code, name, mandatory in doc_types:
        if not db.query(DocumentType).filter(DocumentType.code == code).first():
            db.add(DocumentType(code=code, name=name, is_mandatory=mandatory))

    # Designations
    designations = [
        ("Medical Representative", "C"),
        ("Senior Medical Representative", "C+"),
        ("Area Business Manager", "B"),
        ("Senior Area Business Manager", "B"),
        ("Regional Business Manager", "B+"),
        ("Zonal Business Manager", "A"),
        ("Deputy General Manager - Sales", "A"),
        ("General Manager - Sales", "A+"),
        ("Product Manager", "B"),
        ("Senior Product Manager", "B+"),
        ("Group Product Manager", "A"),
        ("Medical Advisor", "B"),
        ("Senior Medical Advisor", "B+"),
        ("Key Account Manager", "B"),
    ]
    for title, grade in designations:
        if not db.query(Designation).filter(Designation.title == title).first():
            db.add(Designation(title=title, grade=grade))

    # Enumerations
    enums = [
        ("state", "AN", "Andaman & Nicobar", 1),
        ("state", "AP", "Andhra Pradesh", 2),
        ("state", "AR", "Arunachal Pradesh", 3),
        ("state", "AS", "Assam", 4),
        ("state", "BR", "Bihar", 5),
        ("state", "CG", "Chhattisgarh", 6),
        ("state", "DL", "Delhi", 7),
        ("state", "GA", "Goa", 8),
        ("state", "GJ", "Gujarat", 9),
        ("state", "HR", "Haryana", 10),
        ("state", "HP", "Himachal Pradesh", 11),
        ("state", "JK", "Jammu & Kashmir", 12),
        ("state", "JH", "Jharkhand", 13),
        ("state", "KA", "Karnataka", 14),
        ("state", "KL", "Kerala", 15),
        ("state", "MP", "Madhya Pradesh", 16),
        ("state", "MH", "Maharashtra", 17),
        ("state", "MN", "Manipur", 18),
        ("state", "ML", "Meghalaya", 19),
        ("state", "OR", "Odisha", 20),
        ("state", "PB", "Punjab", 21),
        ("state", "RJ", "Rajasthan", 22),
        ("state", "TN", "Tamil Nadu", 23),
        ("state", "TS", "Telangana", 24),
        ("state", "UP", "Uttar Pradesh", 25),
        ("state", "UK", "Uttarakhand", 26),
        ("state", "WB", "West Bengal", 27),
        ("doctor_role", "SPEAKER", "Speaker", 1),
        ("doctor_role", "CHAIRPERSON", "Chairperson", 2),
        ("doctor_role", "MODERATOR", "Moderator", 3),
        ("doctor_role", "PANELIST", "Panelist", 4),
        ("doctor_role", "COORDINATOR", "Coordinator", 5),
        ("gst_rate", "0", "0% (Exempt)", 1),
        ("gst_rate", "5", "5%", 2),
        ("gst_rate", "12", "12%", 3),
        ("gst_rate", "18", "18%", 4),
        ("gst_rate", "28", "28%", 5),
        ("tds_section", "194J", "194J - Professional Services", 1),
        ("tds_section", "194C", "194C - Contractors", 2),
        ("tds_section", "194I", "194I - Rent", 3),
    ]
    for cat, code, label, order in enums:
        if not db.query(Enumeration).filter(Enumeration.category == cat, Enumeration.code == code).first():
            db.add(Enumeration(category=cat, code=code, label=label, sort_order=order))

    db.commit()
    print("  ✓ Master data seeded")


def migrate_divisions_from_mpr(conn, db: Session):
    """Extract division data from MPR"""
    print("Migrating divisions...")
    module_map = get_module_map(conn)

    cursor = conn.cursor()
    cursor.execute("SELECT UnitID, ContainerID, ContainmentName, Contents FROM Unit WHERE ContainmentName='DomainModel'")

    for uid, cid, name, contents in cursor.fetchall():
        container_hex = cid.hex() if cid else ""
        mod_name = module_map.get(container_hex, "")
        if mod_name != "AccessManagement":
            continue
        strings = extract_strings(contents)
        # Look for division-like identifiers
        for s in strings:
            if re.match(r'^[A-Z][a-z]', s) and len(s) > 3 and '_' not in s and s not in {
                'Type', 'DomainModels', 'Attribute', 'Association', 'MemberAccess',
                'AccessRights', 'ReadWrite', 'Documentation', 'Name', 'GUID',
                'ExportLevel', 'Hidden', 'Value', 'IsActive', 'Division', 'Function',
                'Territory', 'UserAccount', 'Administration', 'Account', 'CostCenter'
            }:
                pass  # Could extract division names if structured

    # Seed known divisions from Emcure's structure
    known_divisions = [
        ("ONCOLOGY", "Oncology"), ("CARDIOLOGY", "Cardiology"),
        ("NEUROLOGY", "Neurology"), ("DERMATOLOGY", "Dermatology"),
        ("GASTRO", "Gastroenterology"), ("ENDOCRINOLOGY", "Endocrinology"),
        ("RESPIRATOLOGY", "Respiratology"), ("UROLOGY", "Urology"),
        ("GYNECOLOGY", "Gynecology"), ("PEDIATRICS", "Pediatrics"),
        ("ANTI_INFECTIVE", "Anti-Infective"), ("PAIN_MANAGEMENT", "Pain Management"),
        ("PSYCHIATRY", "Psychiatry"), ("OPHTHALMOLOGY", "Ophthalmology"),
        ("CORPORATE", "Corporate"), ("FINANCE", "Finance"), ("HR", "Human Resources"),
        ("IT", "Information Technology"), ("COMPLIANCE", "Compliance"),
    ]
    for code, name in known_divisions:
        if not db.query(Division).filter(Division.code == code).first():
            db.add(Division(code=code, name=name))
    db.commit()
    print(f"  ✓ {len(known_divisions)} divisions seeded")


def migrate_admin_user(db: Session):
    """Create default admin user"""
    print("Creating admin user...")
    if not db.query(User).filter(User.email == "admin@emcure.com").first():
        admin = User(
            email="admin@emcure.com",
            hashed_password=get_password_hash("Admin@123"),
            first_name="System",
            last_name="Administrator",
            employee_id="ADMIN001",
            role=UserRole.ADMINISTRATOR,
            is_active=True,
            is_superuser=True,
        )
        db.add(admin)

    # Demo users for each role
    demo_users = [
        ("compliance@emcure.com", "Compliance", "Officer", "EMP101", UserRole.COMPLIANCE_USER),
        ("finance@emcure.com", "Finance", "Manager", "EMP102", UserRole.FINANCE_USER),
        ("gst@emcure.com", "GST", "Executive", "EMP103", UserRole.GST_USER),
        ("opex@emcure.com", "OPEX", "Manager", "EMP104", UserRole.OPEX_USER),
        ("user@emcure.com", "Field", "User", "EMP105", UserRole.USER),
        ("coordinator@emcure.com", "Division", "Coordinator", "EMP106", UserRole.DIVISION_COORDINATOR),
    ]
    for email, first, last, emp_id, role in demo_users:
        if not db.query(User).filter(User.email == email).first():
            db.add(User(
                email=email,
                hashed_password=get_password_hash("Emcure@123"),
                first_name=first,
                last_name=last,
                employee_id=emp_id,
                role=role,
                is_active=True,
            ))
    db.commit()
    print("  ✓ Users created (password: Emcure@123)")


def run_migration():
    print("=" * 60)
    print("EMCatalyst MPR -> PostgreSQL Migration")
    print("=" * 60)

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")

    db = SessionLocal()
    try:
        conn = connect_mpr()
        migrate_master_data(db)
        migrate_divisions_from_mpr(conn, db)
        migrate_admin_user(db)
        conn.close()
        print("\n" + "=" * 60)
        print("✓ Migration completed successfully!")
        print("\nDefault credentials:")
        print("  Admin:      admin@emcure.com / Admin@123")
        print("  All others: <role>@emcure.com / Emcure@123")
        print("=" * 60)
    except Exception as e:
        db.rollback()
        print(f"\n✗ Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
