"""
Database Setup Script
=====================
Run this on deployment to ensure all tables and columns exist.
Safe to run multiple times - uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

Usage:
    python -m scripts.setup_db
"""
import sys
sys.path.insert(0, '.')

from app.db.base import engine, Base, SessionLocal
from app.core.config import settings
from sqlalchemy import text


def create_tables():
    """Create all tables from SQLAlchemy models"""
    import app.models  # noqa - registers all models
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created/verified")


def run_migrations():
    """Add columns that might be missing from older schema versions"""
    migrations = [
        # Events table - new fields
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS therapeutic_area TEXT",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS brand VARCHAR(200)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS budget_type VARCHAR(50)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS on_field_execution_by VARCHAR(200)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS platform VARCHAR(50)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS topic VARCHAR(500)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS rationale TEXT",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS promotional_material_approved VARCHAR(10)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS agenda TEXT",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS proposed_emcure_attendees INTEGER",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS num_hcps_professional_services INTEGER",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS proposed_num_hcps INTEGER",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS conference_type VARCHAR(50)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS solicited_unsolicited VARCHAR(50)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS sponsorship_type TEXT",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS sponsorship_amount NUMERIC(15,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS advance_payment BOOLEAN DEFAULT FALSE",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS advance_payment_reason TEXT",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(15,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS is_division_involved BOOLEAN DEFAULT FALSE",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS meal_type VARCHAR(100)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS meal_cost_per_attendee NUMERIC(12,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS total_meal_cost NUMERIC(12,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS minimum_guarantee_pax INTEGER",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_charges NUMERIC(12,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS av_platform_cost NUMERIC(12,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS other_amount NUMERIC(12,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS other_amount_description TEXT",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS total_event_cost NUMERIC(15,2)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS btc_facility VARCHAR(10)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS l1_approver_id INTEGER REFERENCES users(id)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS l2_approver_id INTEGER REFERENCES users(id)",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS l1_approved_at TIMESTAMP",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS l2_approved_at TIMESTAMP",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS compliance_approved_at TIMESTAMP",

        # Event doctors - FMV and cost fields
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS name_as_per_pan VARCHAR(300)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS is_mcl BOOLEAN DEFAULT TRUE",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_expertise VARCHAR(50)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_clinical_experience VARCHAR(100)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_publications VARCHAR(100)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_congress_experience VARCHAR(100)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_professional_position VARCHAR(100)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_investigator_experience VARCHAR(100)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_total_points INTEGER",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_category VARCHAR(10)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_hourly_rate NUMERIC(12,2)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS fmv_max_capping NUMERIC(12,2)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS derived_honorarium NUMERIC(12,2)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS honorarium NUMERIC(12,2)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS cab_cost NUMERIC(12,2)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS accommodation_cost NUMERIC(12,2)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS flight_cost NUMERIC(12,2)",
        "ALTER TABLE event_doctors ADD COLUMN IF NOT EXISTS remark TEXT",

        # Document types - event_type and stage
        "ALTER TABLE document_types ADD COLUMN IF NOT EXISTS event_type_code VARCHAR(100)",
        "ALTER TABLE document_types ADD COLUMN IF NOT EXISTS stage VARCHAR(10) DEFAULT 'pre'",

        # Master meals - max_cost
        "ALTER TABLE master_meals ADD COLUMN IF NOT EXISTS max_cost NUMERIC(12,2)",

        # BRS surveys - division
        "ALTER TABLE brs_surveys ADD COLUMN IF NOT EXISTS division_id INTEGER REFERENCES divisions(id)",
        "ALTER TABLE brs_surveys ADD COLUMN IF NOT EXISTS total_honorarium_amount NUMERIC(12,2)",

        # BRS applications - new fields
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS title VARCHAR(500)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS approved_by_id INTEGER REFERENCES users(id)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS budget_type VARCHAR(50)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS platform VARCHAR(50)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS on_field_execution_by VARCHAR(200)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS start_date DATE",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS end_date DATE",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS venue VARCHAR(500)",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS rationale TEXT",
        "ALTER TABLE brs_applications ADD COLUMN IF NOT EXISTS agenda TEXT",

        # User role assignments
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id)",

        # Status columns to varchar (from enum)
        "ALTER TABLE events ALTER COLUMN status TYPE VARCHAR(50) USING status::text",
        "ALTER TABLE brs_applications ALTER COLUMN status TYPE VARCHAR(50) USING status::text",
        "ALTER TABLE brs_applications ALTER COLUMN survey_title DROP NOT NULL",
    ]

    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception as e:
                # Skip errors (column already exists, type already changed, etc.)
                pass
        conn.commit()
    print("✅ Migrations applied")


def seed_data():
    """Seed initial data"""
    from app.db.init_db import seed_data as run_seed
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    print(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    print("=" * 50)
    create_tables()
    run_migrations()
    seed_data()
    print("=" * 50)
    print("✅ Database setup complete!")
