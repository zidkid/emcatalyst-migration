#!/usr/bin/env python3
"""
Supplemental migration: brands, meals, and historical events.
Run after migrate_prod_data.py has completed.
    python scripts/migrate_supplemental.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from decimal import Decimal, InvalidOperation
from sqlalchemy import text
import app.models  # noqa

from app.db.base import SessionLocal, engine, Base
SQL_FILE = r"C:\Users\10015309\Downloads\mendix_cat_prod_database_452c862d_e2b9_43a4_926b_9d14b93ef722_20260317.sql"
BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Reuse parsers from main migration
# ---------------------------------------------------------------------------

def _sql_to_python(val_str):
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


def parse_mendix_date(val):
    if not val:
        return None
    s = str(val).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:19], fmt)
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# Create new tables if they don't exist
# ---------------------------------------------------------------------------

def ensure_new_tables(db):
    """Create new master tables and add missing columns."""
    print("Ensuring new tables exist...")
    stmts = [
        """CREATE TABLE IF NOT EXISTS master_brands (
            id SERIAL PRIMARY KEY,
            mendix_id VARCHAR(30) UNIQUE,
            name VARCHAR(200) NOT NULL,
            therapeutic_area VARCHAR(200),
            is_active BOOLEAN DEFAULT true
        )""",
        """CREATE TABLE IF NOT EXISTS master_meals (
            id SERIAL PRIMARY KEY,
            mendix_id VARCHAR(30) UNIQUE,
            name VARCHAR(200) NOT NULL,
            is_active BOOLEAN DEFAULT true
        )""",
        """CREATE TABLE IF NOT EXISTS master_cities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            state VARCHAR(200),
            is_active BOOLEAN DEFAULT true
        )""",
        """CREATE TABLE IF NOT EXISTS master_sponsorship_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true
        )""",
    ]
    for stmt in stmts:
        try:
            db.execute(text(stmt))
        except Exception as e:
            print(f"  Warning: {e}")
    db.commit()
    print("  Tables ready.")


# ---------------------------------------------------------------------------
# Migrate brands
# ---------------------------------------------------------------------------

def migrate_brands(db):
    from app.models.master import MasterBrand

    if db.query(MasterBrand).count() > 0:
        print("  Brands already migrated, skipping.")
        return

    # master$master_brand cols: id, brandname, isactive, createddate, changeddate, owner, changedby
    brands = []
    for row in stream_table_rows(SQL_FILE, "master$master_brand"):
        if len(row) < 2:
            continue
        brands.append(MasterBrand(
            mendix_id=str(row[0]),
            name=safe_str(row[1], 200) or "Unknown",
            is_active=bool(row[2]) if row[2] is not None else True,
        ))

    if brands:
        db.bulk_save_objects(brands)
        db.commit()
        print(f"  Brands migrated: {len(brands)}")
    else:
        print("  No brands found in SQL dump.")


# ---------------------------------------------------------------------------
# Migrate meals
# ---------------------------------------------------------------------------

def migrate_meals(db):
    from app.models.master import MasterMeal

    if db.query(MasterMeal).count() > 0:
        print("  Meals already migrated, skipping.")
        return

    # master$master_meals cols: id, mealname, isactive, ...
    meals = []
    for row in stream_table_rows(SQL_FILE, "master$master_meals"):
        if len(row) < 2:
            continue
        meals.append(MasterMeal(
            mendix_id=str(row[0]),
            name=safe_str(row[1], 200) or "Unknown",
            is_active=bool(row[2]) if row[2] is not None else True,
        ))

    if meals:
        db.bulk_save_objects(meals)
        db.commit()
        print(f"  Meals migrated: {len(meals)}")
    else:
        # Seed default meals if not in dump
        defaults = ["Breakfast", "Lunch", "Dinner", "Tea/Coffee", "Snacks", "Cocktail"]
        for name in defaults:
            db.add(MasterMeal(name=name))
        db.commit()
        print(f"  Meals seeded with {len(defaults)} defaults.")


# ---------------------------------------------------------------------------
# Seed cities and sponsorship types
# ---------------------------------------------------------------------------

def seed_cities(db):
    from app.models.master import MasterCity

    if db.query(MasterCity).count() > 0:
        print("  Cities already seeded, skipping.")
        return

    cities = [
        ("Mumbai", "Maharashtra"), ("Pune", "Maharashtra"), ("Nashik", "Maharashtra"),
        ("Aurangabad", "Maharashtra"), ("Nagpur", "Maharashtra"),
        ("Delhi", "Delhi"), ("New Delhi", "Delhi"), ("Gurugram", "Haryana"),
        ("Noida", "Uttar Pradesh"), ("Ghaziabad", "Uttar Pradesh"),
        ("Bengaluru", "Karnataka"), ("Mysuru", "Karnataka"), ("Hubli", "Karnataka"),
        ("Chennai", "Tamil Nadu"), ("Coimbatore", "Tamil Nadu"), ("Madurai", "Tamil Nadu"),
        ("Hyderabad", "Telangana"), ("Secunderabad", "Telangana"), ("Warangal", "Telangana"),
        ("Ahmedabad", "Gujarat"), ("Surat", "Gujarat"), ("Vadodara", "Gujarat"),
        ("Rajkot", "Gujarat"), ("Gandhinagar", "Gujarat"),
        ("Kolkata", "West Bengal"), ("Howrah", "West Bengal"), ("Siliguri", "West Bengal"),
        ("Jaipur", "Rajasthan"), ("Jodhpur", "Rajasthan"), ("Udaipur", "Rajasthan"),
        ("Kochi", "Kerala"), ("Thiruvananthapuram", "Kerala"), ("Kozhikode", "Kerala"),
        ("Bhopal", "Madhya Pradesh"), ("Indore", "Madhya Pradesh"), ("Jabalpur", "Madhya Pradesh"),
        ("Lucknow", "Uttar Pradesh"), ("Kanpur", "Uttar Pradesh"), ("Varanasi", "Uttar Pradesh"),
        ("Patna", "Bihar"), ("Gaya", "Bihar"),
        ("Bhubaneswar", "Odisha"), ("Cuttack", "Odisha"),
        ("Chandigarh", "Punjab"), ("Amritsar", "Punjab"), ("Ludhiana", "Punjab"),
        ("Guwahati", "Assam"),
        ("Raipur", "Chhattisgarh"),
        ("Ranchi", "Jharkhand"),
        ("Dehradun", "Uttarakhand"),
        ("Shimla", "Himachal Pradesh"),
    ]
    for name, state in cities:
        db.add(MasterCity(name=name, state=state))
    db.commit()
    print(f"  Cities seeded: {len(cities)}")


def seed_sponsorship_types(db):
    from app.models.master import MasterSponsorshipType

    if db.query(MasterSponsorshipType).count() > 0:
        print("  Sponsorship types already seeded, skipping.")
        return

    types = [
        ("Industry Sponsored", "Event fully sponsored by Emcure"),
        ("Co-Sponsored", "Event co-sponsored with another organization"),
        ("Fellowship", "Fellowship grant for medical education"),
        ("Exhibition", "Exhibition stall or booth sponsorship"),
        ("CME Grant", "Continuing Medical Education grant"),
        ("Speaker Fees", "Honorarium for speaker engagements"),
    ]
    for name, desc in types:
        db.add(MasterSponsorshipType(name=name, description=desc))
    db.commit()
    print(f"  Sponsorship types seeded: {len(types)}")


# ---------------------------------------------------------------------------
# Migrate historical events
# ---------------------------------------------------------------------------

def probe_event_columns(sql_file, limit=3):
    """Print first few rows of event table to understand column structure."""
    print("\n--- Probing eventinitiation$event_initiation_form ---")
    for i, row in enumerate(stream_table_rows(sql_file, "eventinitiation$event_initiation_form")):
        print(f"Row {i} ({len(row)} cols):")
        for j, v in enumerate(row):
            if v is not None:
                print(f"  [{j}] {repr(v)[:80]}")
        if i >= limit - 1:
            break


def migrate_historical_events(db):
    """
    Migrate historical events from Mendix event_initiation_form.
    Column mapping confirmed by probe:
      [0]  mendix_id
      [1]  event_type_name (e.g. 'CME Event')
      [6]  event_title
      [7]  event_start_date
      [8]  event_end_date
      [9]  city
      [10] venue
      [23] event_code  (e.g. 'CEMC0000724-25')
      [26] status      (e.g. 'Settled', 'Pending', 'Approved')
      [47] event_type_code
      [51] division_mendix_id
      [52] initiator_mendix_id
    """
    from app.models.event import Event, EventStatus
    from app.models.user import Division, User

    existing_codes = {e.event_code for e in db.query(Event.event_code).all()}

    # Division mendix_id -> db id
    div_map = {d.mendix_id: d.id for d in db.query(Division).all() if d.mendix_id}

    # User mendix_id -> db id
    user_mendix_map = {u.mendix_id: u.id for u in db.query(User).all() if u.mendix_id}

    admin = db.query(User).filter(User.email == "admin@emcure.com").first()
    fallback_id = admin.id if admin else 1

    STATUS_MAP = {
        "Draft": EventStatus.DRAFT,
        "Pending": EventStatus.SUBMITTED,
        "Submitted": EventStatus.SUBMITTED,
        "UnderReview": EventStatus.UNDER_REVIEW,
        "Under Review": EventStatus.UNDER_REVIEW,
        "Approved": EventStatus.APPROVED,
        "Rejected": EventStatus.REJECTED,
        "Cancelled": EventStatus.CANCELLED,
        "Settled": EventStatus.COMPLETED,
        "Completed": EventStatus.COMPLETED,
        "Closed": EventStatus.COMPLETED,
    }

    print("Migrating historical events...")
    batch = []
    total = 0
    skipped = 0

    for row in stream_table_rows(SQL_FILE, "eventinitiation$event_initiation_form"):
        if len(row) < 24:
            skipped += 1
            continue

        mendix_id = str(row[0])

        # Event code at [23]
        event_code = safe_str(row[23], 50) if len(row) > 23 else None
        if not event_code:
            event_code = f"MX{mendix_id[-8:]}"

        if event_code in existing_codes:
            skipped += 1
            continue
        existing_codes.add(event_code)

        title = safe_str(row[6], 500) if len(row) > 6 and row[6] else None
        if not title:
            title = safe_str(row[13], 500) if len(row) > 13 and row[13] else f"Event {event_code}"

        event_type_name = safe_str(row[1], 100) if len(row) > 1 else None
        event_type_code = safe_str(row[47], 100) if len(row) > 47 else None
        event_type = event_type_name or event_type_code

        event_date = parse_mendix_date(row[7]) if len(row) > 7 else None
        event_end_date = parse_mendix_date(row[8]) if len(row) > 8 else None

        city = safe_str(row[9], 100) if len(row) > 9 else None
        venue = safe_str(row[10], 500) if len(row) > 10 else None

        status_str = safe_str(row[26], 50) if len(row) > 26 else None
        status = EventStatus.COMPLETED
        if status_str:
            status = STATUS_MAP.get(status_str, EventStatus.COMPLETED)

        div_mendix = str(row[51]) if len(row) > 51 and row[51] else None
        division_id = div_map.get(div_mendix) if div_mendix else None

        init_mendix = str(row[52]) if len(row) > 52 and row[52] else None
        initiator_id = user_mendix_map.get(init_mendix, fallback_id) if init_mendix else fallback_id

        event = Event(
            event_code=event_code,
            event_title=(title or event_code)[:500],
            event_type=event_type,
            event_date=event_date,
            event_end_date=event_end_date,
            city=city,
            venue=venue,
            division_id=division_id,
            status=status,
            initiator_id=initiator_id,
            step=5,
        )
        batch.append(event)
        total += 1

        if len(batch) >= BATCH_SIZE:
            db.bulk_save_objects(batch)
            db.commit()
            batch = []
            print(f"  ...{total} events inserted")

    if batch:
        db.bulk_save_objects(batch)
        db.commit()

    print(f"  Historical events migrated: {total}, skipped: {skipped}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not os.path.exists(SQL_FILE):
        print(f"ERROR: SQL file not found: {SQL_FILE}")
        sys.exit(1)

    print(f"Supplemental migration from: {SQL_FILE}")

    db = SessionLocal()
    try:
        ensure_new_tables(db)

        print("\n--- Migrating Brands ---")
        migrate_brands(db)

        print("\n--- Migrating Meals ---")
        migrate_meals(db)

        print("\n--- Seeding Cities ---")
        seed_cities(db)

        print("\n--- Seeding Sponsorship Types ---")
        seed_sponsorship_types(db)

        print("\n--- Migrating Historical Events ---")
        migrate_historical_events(db)

        # Summary
        from app.models.master import MasterBrand, MasterMeal, MasterCity, MasterSponsorshipType
        from app.models.event import Event
        print("\n=== Supplemental migration complete! ===")
        print(f"  Brands:            {db.query(MasterBrand).count()}")
        print(f"  Meals:             {db.query(MasterMeal).count()}")
        print(f"  Cities:            {db.query(MasterCity).count()}")
        print(f"  Sponsorship Types: {db.query(MasterSponsorshipType).count()}")
        print(f"  Total Events:      {db.query(Event).count()}")

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
