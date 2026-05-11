#!/usr/bin/env python3
"""
Migrate production Mendix Catalyst data into new EMCatalyst schema.

Streams through the 1GB SQL dump without loading it entirely into memory.
Run from backend directory:
    python scripts/migrate_prod_data.py

Requires backend dependencies installed and .env configured.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collections import defaultdict
from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.base import SessionLocal, engine, Base
from app.core.security import get_password_hash
import app.models  # noqa - registers all models with Base.metadata

SQL_FILE = r"C:\Users\10015309\Downloads\mendix_cat_prod_database_452c862d_e2b9_43a4_926b_9d14b93ef722_20260317.sql"
DEFAULT_PASSWORD = "Emcure@123"
ADMIN_PASSWORD = "Admin@123"
BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# SQL parsing
# ---------------------------------------------------------------------------

def _sql_to_python(val_str):
    """Convert raw SQL token (not a quoted string) to Python value."""
    s = val_str.strip()
    if s == "NULL":
        return None
    if s == "true":
        return True
    if s == "false":
        return False
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        pass
    return s or None


def parse_sql_row(row_str):
    """
    Parse a SQL VALUES row like "(v1, 'v2', NULL, true)" into a Python list.
    Handles escaped single quotes ('') inside strings.
    """
    content = row_str.strip()
    if content.startswith("("):
        content = content[1:]
    if content.endswith(")"):
        content = content[:-1]

    values = []
    buf = []
    in_str = False
    is_string_val = False
    i = 0
    n = len(content)

    while i < n:
        c = content[i]
        if in_str:
            if c == "'":
                if i + 1 < n and content[i + 1] == "'":
                    buf.append("'")
                    i += 2
                    continue
                else:
                    in_str = False
            else:
                buf.append(c)
        else:
            if c == "'":
                in_str = True
                is_string_val = True
            elif c == ",":
                raw = "".join(buf).strip()
                values.append(raw if is_string_val else _sql_to_python(raw))
                buf = []
                is_string_val = False
            else:
                buf.append(c)
        i += 1

    raw = "".join(buf).strip()
    if raw or is_string_val:
        values.append(raw if is_string_val else _sql_to_python(raw))

    return values


def stream_table_rows(sql_file, table_name):
    """
    Yield parsed rows (list of Python values) for a given table.
    Handles multi-row INSERT blocks with parenthesized rows.
    Each row may span multiple lines (for TEXT fields with embedded newlines).
    """
    target = f'INSERT INTO public."{table_name}" VALUES'
    in_block = False
    paren_depth = 0
    in_str = False
    row_buf = []

    with open(sql_file, "r", encoding="utf-8", errors="replace") as f:
        for raw_line in f:
            line = raw_line.rstrip("\n")

            if not in_block:
                if line.startswith(target):
                    in_block = True
                continue

            j = 0
            while j < len(line):
                c = line[j]

                if in_str:
                    row_buf.append(c)
                    if c == "'":
                        if j + 1 < len(line) and line[j + 1] == "'":
                            row_buf.append("'")
                            j += 2
                            continue
                        else:
                            in_str = False
                elif c == "'":
                    in_str = True
                    row_buf.append(c)
                elif c == "(":
                    paren_depth += 1
                    if paren_depth == 1:
                        row_buf = ["("]
                    else:
                        row_buf.append(c)
                elif c == ")":
                    row_buf.append(c)
                    paren_depth -= 1
                    if paren_depth == 0:
                        yield parse_sql_row("".join(row_buf))
                        row_buf = []
                elif c == ";" and paren_depth == 0 and not in_str:
                    in_block = False
                    return
                elif paren_depth > 0:
                    row_buf.append(c)
                j += 1

            if in_str:
                row_buf.append("\n")


def safe_str(val, max_len=None):
    if val is None:
        return None
    s = str(val).strip()
    if max_len:
        s = s[:max_len]
    return s or None


def safe_decimal(val):
    if val is None:
        return None
    try:
        return Decimal(str(val))
    except (InvalidOperation, ValueError):
        return None


def safe_int(val):
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Role mapping
# ---------------------------------------------------------------------------

ROLE_MAP = {
    "Administrator": "Administrator",
    "ComplianceUser": "ComplianceUser",
    "Compliance User": "ComplianceUser",
    "DivisionCoOrdinator": "DivisionCoOrdinator",
    "Division Co-Ordinator": "DivisionCoOrdinator",
    "FinanceUser": "FinanceUser",
    "Finance User": "FinanceUser",
    "GSTuser": "GSTuser",
    "GST User": "GSTuser",
    "OPEXUser": "OPEXUser",
    "OPEX User": "OPEXUser",
    "FunctionalUser": "FunctionalUser",
    "Functional User": "FunctionalUser",
    "MyAdmin": "MyAdmin",
    "User": "User",
}


def map_role(group_name):
    if not group_name:
        return "User"
    for key, val in ROLE_MAP.items():
        if key.lower() in group_name.lower():
            return val
    return "User"


# ---------------------------------------------------------------------------
# Phase 1: read small lookup tables
# ---------------------------------------------------------------------------

def collect_lookup_tables(sql_file):
    """Single pass to collect all small tables needed for cross-referencing."""
    print("Phase 1: Collecting lookup tables (divisions, users, groups)...")

    # accessmanagement$division
    # cols: id, name, isactive, cluster, createddate, changeddate, owner, changedby, eventcodeprefix, costcenter, profitcenter
    divisions = {}  # mendix_id -> dict
    for row in stream_table_rows(sql_file, "accessmanagement$division"):
        if len(row) < 11:
            continue
        mendix_id = str(row[0])
        divisions[mendix_id] = {
            "mendix_id": mendix_id,
            "name": safe_str(row[1], 200),
            "is_active": bool(row[2]) if row[2] is not None else True,
            "cluster": safe_str(row[3], 20),
            "eventcodeprefix": safe_str(row[8], 200),
            "costcenter": safe_str(row[9], 200),
            "profitcenter": safe_str(row[10], 200),
        }
    print(f"  Divisions: {len(divisions)}")

    # accessmanagement$group
    # cols: id, name, isactive, createddate, changeddate, owner, changedby
    groups = {}  # mendix_id -> name
    for row in stream_table_rows(sql_file, "accessmanagement$group"):
        if len(row) < 2:
            continue
        groups[str(row[0])] = safe_str(row[1])
    print(f"  Groups: {len(groups)}")

    # administration$account_group
    # cols: administration$accountid, accessmanagement$groupid
    account_groups = defaultdict(list)  # account_id -> [group_ids]
    for row in stream_table_rows(sql_file, "administration$account_group"):
        if len(row) < 2:
            continue
        account_groups[str(row[0])].append(str(row[1]))
    print(f"  Account-group mappings: {len(account_groups)}")

    # administration$account
    # cols: id, fullname, email, islocaluser, username, submetaobjectname
    accounts = {}  # email -> {id, fullname, username}
    accounts_by_id = {}  # mendix_id -> email
    for row in stream_table_rows(sql_file, "administration$account"):
        if len(row) < 3:
            continue
        acct_id = str(row[0])
        email = safe_str(row[2], 200)
        if email:
            email_lower = email.lower()
            accounts[email_lower] = {
                "id": acct_id,
                "fullname": safe_str(row[1], 200),
                "username": safe_str(row[4], 200),
            }
            accounts_by_id[acct_id] = email_lower
    print(f"  Accounts: {len(accounts)}")

    # accessmanagement$useraccount
    # cols: id, firstname, middlename, lastname, employeeid, currentaddress, division, designationtitle,
    #        officemobilenumber, costcenterid, costcenter, currentcountry, businessunit, department,
    #        groupcompany, personalmobilenumber, employeestatus, joblevel, directmanageremployeeid,
    #        directmanageremail, directmanagername, darwinappemployeeid, emailid, extensionnumber,
    #        isvalidatewithad, emsignermessage, isemsigneraccountavailable, cannotinitiaterequest,
    #        splitdeparment, officelocation, officestate, customlocation, splitrole, splitterritory,
    #        territoryname, currentlocation, territorycode, role, dateofbirth, officecity, gender,
    #        catalystadditionaldivision
    user_accounts = []
    for row in stream_table_rows(sql_file, "accessmanagement$useraccount"):
        if len(row) < 23:
            continue
        ua = {
            "mendix_id": str(row[0]),
            "first_name": safe_str(row[1], 100),
            "middle_name": safe_str(row[2], 100),
            "last_name": safe_str(row[3], 100),
            "employee_id": safe_str(row[4], 50),
            "division_name": safe_str(row[6], 200),
            "designation_title": safe_str(row[7], 200),
            "office_mobile_no": safe_str(row[8], 20),
            "cost_center_code": safe_str(row[10], 200),
            "business_unit": safe_str(row[12], 200),
            "department": safe_str(row[13], 200),
            "group_company": safe_str(row[14], 200),
            "personal_mobile_no": safe_str(row[15], 20),
            "employee_status": safe_str(row[16], 200),
            "job_level": safe_str(row[17], 200),
            "direct_manager_employee_id": safe_str(row[18], 200),
            "direct_manager_email": safe_str(row[19], 200),
            "direct_manager_name": safe_str(row[20], 200),
            "email": safe_str(row[22], 200),
            "extension_number": safe_str(row[23], 200),
            "office_state": safe_str(row[30], 200) if len(row) > 30 else None,
            "office_city": safe_str(row[39], 200) if len(row) > 39 else None,
            "gender": safe_str(row[40], 6) if len(row) > 40 else None,
            "date_of_birth": safe_str(row[38], 200) if len(row) > 38 else None,
        }
        user_accounts.append(ua)
    print(f"  User accounts: {len(user_accounts)}")

    return divisions, groups, account_groups, accounts, accounts_by_id, user_accounts


# ---------------------------------------------------------------------------
# Phase 2: Insert into new schema
# ---------------------------------------------------------------------------

def recreate_tables():
    """Drop and recreate all tables with new schema."""
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("  Tables recreated.")


def insert_divisions(db, divisions):
    from app.models.user import Division
    print(f"Inserting {len(divisions)} divisions...")
    for d in divisions.values():
        div = Division(
            mendix_id=d["mendix_id"],
            name=d["name"] or f"Division_{d['mendix_id']}",
            cluster=d["cluster"],
            costcenter=d["costcenter"],
            profitcenter=d["profitcenter"],
            eventcodeprefix=d["eventcodeprefix"],
            is_active=d["is_active"],
        )
        db.add(div)
    db.commit()
    print(f"  Done. Divisions inserted: {len(divisions)}")

    # Return name -> id mapping
    divs = db.query(Division).all()
    return {d.name: d.id for d in divs}, {d.mendix_id: d.id for d in divs if d.mendix_id}


def insert_users(db, user_accounts, accounts, accounts_by_id, account_groups, groups, division_name_map):
    from app.models.user import User, UserRole

    print(f"Inserting {len(user_accounts)} users...")

    # Admin user always first
    admin_email = "admin@emcure.com"
    if not db.query(User).filter(User.email == admin_email).first():
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            first_name="System",
            last_name="Administrator",
            role=UserRole.ADMINISTRATOR,
            is_active=True,
            is_superuser=True,
            employee_id="EMP001",
        )
        db.add(admin)
        db.commit()

    inserted = 0
    skipped = 0
    email_set = {admin_email}

    for ua in user_accounts:
        email = ua.get("email")
        if not email:
            skipped += 1
            continue
        email_lower = email.lower()
        if email_lower in email_set:
            skipped += 1
            continue
        email_set.add(email_lower)

        # Determine role from account_groups
        role_str = "User"
        if email_lower in accounts:
            acct_id = accounts[email_lower]["id"]
            group_ids = account_groups.get(acct_id, [])
            for gid in group_ids:
                gname = groups.get(gid, "")
                if gname:
                    role_str = map_role(gname)
                    break

        # Division lookup
        div_id = None
        if ua.get("division_name"):
            div_id = division_name_map.get(ua["division_name"])

        full_name = " ".join(filter(None, [ua.get("first_name"), ua.get("last_name")])) or email_lower.split("@")[0]

        user = User(
            mendix_id=ua["mendix_id"],
            email=email_lower,
            hashed_password=get_password_hash(DEFAULT_PASSWORD),
            first_name=ua.get("first_name"),
            middle_name=ua.get("middle_name"),
            last_name=ua.get("last_name"),
            employee_id=ua.get("employee_id"),
            designation_title=ua.get("designation_title"),
            office_mobile_no=ua.get("office_mobile_no"),
            personal_mobile_no=ua.get("personal_mobile_no"),
            business_unit=ua.get("business_unit"),
            department=ua.get("department"),
            group_company=ua.get("group_company"),
            employee_status=ua.get("employee_status"),
            job_level=ua.get("job_level"),
            direct_manager_employee_id=ua.get("direct_manager_employee_id"),
            direct_manager_email=ua.get("direct_manager_email"),
            direct_manager_name=ua.get("direct_manager_name"),
            office_state=ua.get("office_state"),
            office_city=ua.get("office_city"),
            gender=ua.get("gender"),
            date_of_birth=ua.get("date_of_birth"),
            extension_number=ua.get("extension_number"),
            division_id=div_id,
            role=UserRole(role_str) if role_str in [r.value for r in UserRole] else UserRole.USER,
            is_active=True,
        )
        db.add(user)
        inserted += 1

        if inserted % BATCH_SIZE == 0:
            db.commit()
            print(f"  ...{inserted} users inserted")

    db.commit()
    print(f"  Users inserted: {inserted}, skipped: {skipped}")


def insert_master_tables(db, sql_file):
    from app.models.master import (
        MasterSpeciality, MasterHcpRole, MasterTherapeutic, MasterState,
        EventType, FmvCriteria, CompanyCode, DocumentType, Designation
    )

    # Specialities: cols id, specialityname, isactive, ...
    specs = []
    for row in stream_table_rows(sql_file, "master$master_speciality"):
        if len(row) < 2:
            continue
        specs.append(MasterSpeciality(
            mendix_id=str(row[0]),
            name=safe_str(row[1], 50) or "Unknown",
            is_active=bool(row[2]) if row[2] is not None else True,
        ))
    db.bulk_save_objects(specs)
    print(f"  Specialities: {len(specs)}")

    # HCP Roles: cols id, hcprolename, isactive, ...
    roles = []
    for row in stream_table_rows(sql_file, "master$master_hcp_roles"):
        if len(row) < 2:
            continue
        roles.append(MasterHcpRole(
            mendix_id=str(row[0]),
            name=safe_str(row[1], 40) or "Unknown",
            is_active=bool(row[2]) if row[2] is not None else True,
        ))
    db.bulk_save_objects(roles)
    print(f"  HCP Roles: {len(roles)}")

    # Therapeutics: cols id, therapeuticname, isactive, ...
    therapeutics = []
    for row in stream_table_rows(sql_file, "master$master_therapeutic"):
        if len(row) < 2:
            continue
        therapeutics.append(MasterTherapeutic(
            mendix_id=str(row[0]),
            name=safe_str(row[1], 40) or "Unknown",
            is_active=bool(row[2]) if row[2] is not None else True,
        ))
    db.bulk_save_objects(therapeutics)
    print(f"  Therapeutics: {len(therapeutics)}")

    # States: cols id, statename, isactive
    states = []
    for row in stream_table_rows(sql_file, "master$state"):
        if len(row) < 2:
            continue
        states.append(MasterState(
            mendix_id=str(row[0]),
            name=safe_str(row[1], 200) or "Unknown",
            is_active=bool(row[2]) if row[2] is not None else True,
        ))
    db.bulk_save_objects(states)
    print(f"  States: {len(states)}")

    # Event types from master: cols id, eventname, isactive, eventdescription, ...
    existing_codes = {et.code for et in db.query(EventType).all()}
    evt_types = []
    for row in stream_table_rows(sql_file, "master$master_events"):
        if len(row) < 2:
            continue
        name = safe_str(row[1], 200)
        code = (name or "").upper().replace(" ", "_")[:20]
        if code and code not in existing_codes:
            existing_codes.add(code)
            evt_types.append(EventType(
                code=code,
                name=name or "Unknown",
                description=safe_str(row[3], 200) if len(row) > 3 else None,
                is_active=bool(row[2]) if row[2] is not None else True,
            ))
    db.bulk_save_objects(evt_types)
    print(f"  Event types from master: {len(evt_types)}")

    # FMV Criteria: cols id, enumclinicalpracticeexperiance, enumexpericeasinvestigatorinclinicaltrials,
    #   enumexperties, enumprofessionalpossition, enumpriorexperienceofcongresses, enumpublicationsinliteratures
    fmv = []
    for row in stream_table_rows(sql_file, "master$fmv_calculator"):
        if len(row) < 7:
            continue
        fmv.append(FmvCriteria(
            mendix_id=str(row[0]),
            clinical_practice_experience=safe_str(row[1], 34),
            investigator_experience=safe_str(row[2], 50),
            expertise=safe_str(row[3], 21),
            professional_position=safe_str(row[4], 75),
            congress_experience=safe_str(row[5], 101),
            publications=safe_str(row[6], 78),
        ))
    db.bulk_save_objects(fmv)
    print(f"  FMV criteria: {len(fmv)}")

    # Seed fixed master data
    if not db.query(CompanyCode).filter(CompanyCode.code == "EMC1").first():
        db.add(CompanyCode(code="EMC1", name="Emcure Pharmaceuticals Ltd", country="IN", currency="INR"))

    doc_types = [
        ("INVITATION", "Event Invitation Letter", True),
        ("AGENDA", "Event Agenda/Program", True),
        ("ATTENDANCE", "Attendance Register", True),
        ("PHOTOS", "Event Photographs", False),
        ("INVOICE", "Vendor Invoice", True),
        ("PAN", "PAN Card", True),
        ("BANK", "Bank Details / Cancelled Cheque", True),
        ("CONSENT", "Speaker Consent Form", True),
        ("FMV_JUSTIFICATION", "FMV Justification", True),
    ]
    for code, name, mandatory in doc_types:
        if not db.query(DocumentType).filter(DocumentType.code == code).first():
            db.add(DocumentType(code=code, name=name, is_mandatory=mandatory))

    designations = [
        ("Medical Representative", "C"), ("Senior Medical Representative", "C+"),
        ("Area Business Manager", "B"), ("Regional Business Manager", "B+"),
        ("Zonal Business Manager", "A"), ("General Manager - Sales", "A+"),
        ("Product Manager", "B"), ("Senior Product Manager", "B+"),
        ("Medical Advisor", "B"),
    ]
    for title, grade in designations:
        if not db.query(Designation).filter(Designation.title == title).first():
            db.add(Designation(title=title, grade=grade))

    db.commit()


def insert_hcp_doctors(db, sql_file):
    from app.models.master import HcpDoctor

    print("Inserting HCP doctors (streaming)...")
    batch = []
    total = 0

    # cols: id, firstname, middlename, lastname, fullname, qualification, email, experience,
    #        uidnumber, occupationaladdress, pannumber, city, state, pincode, degree, diploma,
    #        gender, mciregistrationnumber, isregisteredundergst, isactive, isdraft, sbucode,
    #        mobilenumber, aboutdoctor, professionalaccomplishment, keyinterest, doctortype,
    #        doctorclass, doctorstation, servicepreference, hml, nameasperbankrecords, bankname,
    #        accountnumber, bankbranch, ifsccode, hourlyrate, maximumcapping, createddate,
    #        changeddate, changedby, owner, isadded
    for row in stream_table_rows(sql_file, "master$master_doctors"):
        if len(row) < 20:
            continue
        mobile = safe_str(row[22], 20) if len(row) > 22 else None
        if mobile and mobile.isdigit() and len(mobile) > 10:
            mobile = mobile[-10:]

        batch.append(HcpDoctor(
            mendix_id=str(row[0]),
            first_name=safe_str(row[1], 200),
            middle_name=safe_str(row[2], 200),
            last_name=safe_str(row[3], 200),
            full_name=safe_str(row[4], 200),
            qualification=safe_str(row[5], 200),
            email=safe_str(row[6], 200),
            experience=safe_str(row[7], 200),
            uid_number=safe_str(row[8], 200),
            address=safe_str(row[9], 200),
            pan_number=safe_str(row[10], 200),
            city=safe_str(row[11], 200),
            state=safe_str(row[12], 50),
            pincode=safe_str(safe_int(row[13]), 10) if len(row) > 13 else None,
            degree=safe_str(row[14], 50) if len(row) > 14 else None,
            diploma=safe_str(row[15], 50) if len(row) > 15 else None,
            gender=safe_str(row[16], 6) if len(row) > 16 else None,
            mci_reg_number=safe_str(row[17], 50) if len(row) > 17 else None,
            is_registered_under_gst=bool(row[18]) if len(row) > 18 and row[18] is not None else False,
            is_active=bool(row[19]) if len(row) > 19 and row[19] is not None else True,
            is_draft=bool(row[20]) if len(row) > 20 and row[20] is not None else False,
            sbu_code=safe_str(row[21], 200) if len(row) > 21 else None,
            mobile_number=mobile,
            doctor_type=safe_str(row[26], 20) if len(row) > 26 else None,
            doctor_class=safe_str(row[27], 1) if len(row) > 27 else None,
            hml=safe_str(row[30], 1) if len(row) > 30 else None,
            name_as_per_bank=safe_str(row[31], 70) if len(row) > 31 else None,
            bank_name=safe_str(row[32], 50) if len(row) > 32 else None,
            account_number=safe_str(row[33], 25) if len(row) > 33 else None,
            bank_branch=safe_str(row[34], 30) if len(row) > 34 else None,
            ifsc_code=safe_str(row[35], 50) if len(row) > 35 else None,
            hourly_rate=safe_decimal(row[36]) if len(row) > 36 else None,
            max_capping=safe_decimal(row[37]) if len(row) > 37 else None,
        ))
        total += 1

        if len(batch) >= BATCH_SIZE:
            db.bulk_save_objects(batch)
            db.commit()
            batch = []
            if total % 5000 == 0:
                print(f"  ...{total} doctors inserted")

    if batch:
        db.bulk_save_objects(batch)
        db.commit()

    print(f"  HCP Doctors total: {total}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not os.path.exists(SQL_FILE):
        print(f"ERROR: SQL file not found: {SQL_FILE}")
        sys.exit(1)

    print(f"Starting migration from: {SQL_FILE}")
    print(f"File size: {os.path.getsize(SQL_FILE) / 1024 / 1024:.1f} MB")

    # Phase 1: collect small lookup tables
    divisions, groups, account_groups, accounts, accounts_by_id, user_accounts = collect_lookup_tables(SQL_FILE)

    # Phase 2: recreate schema
    recreate_tables()

    db = SessionLocal()
    try:
        # Insert divisions
        division_name_map, division_mendix_map = insert_divisions(db, divisions)

        # Insert users (needs division mapping)
        insert_users(db, user_accounts, accounts, accounts_by_id, account_groups, groups, division_name_map)

        # Insert master tables (streams SQL file again for large tables)
        print("Phase 3: Inserting master data...")
        insert_master_tables(db, SQL_FILE)

        # Insert HCP doctors (large table, batch streaming)
        insert_hcp_doctors(db, SQL_FILE)

        print("\n=== Migration complete! ===")
        from app.models.user import User, Division
        from app.models.master import HcpDoctor, FmvCriteria, MasterSpeciality
        print(f"  Divisions:    {db.query(Division).count()}")
        print(f"  Users:        {db.query(User).count()}")
        print(f"  HCP Doctors:  {db.query(HcpDoctor).count()}")
        print(f"  FMV Criteria: {db.query(FmvCriteria).count()}")
        print(f"  Specialities: {db.query(MasterSpeciality).count()}")
        print(f"\nDefault password for all imported users: {DEFAULT_PASSWORD}")
        print(f"Admin login: admin@emcure.com / {ADMIN_PASSWORD}")
        print("Note: Also check compliance@emcure.com and finance@emcure.com users.")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
