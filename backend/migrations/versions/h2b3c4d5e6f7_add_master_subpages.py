"""add master subpages to RBAC

Revision ID: h2b3c4d5e6f7
Revises: g1a2b3c4d5e6
Create Date: 2026-05-16 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'h2b3c4d5e6f7'
down_revision: Union[str, None] = 'g1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# New master sub-pages to insert
MASTER_PAGES = [
    ("masters_entities", "Entities", "/masters/entities", "Masters"),
    ("masters_divisions", "Divisions", "/masters/divisions", "Masters"),
    ("masters_doctors", "Doctors", "/masters/doctors", "Masters"),
    ("masters_brands", "Brands", "/masters/brands", "Masters"),
    ("masters_therapeutics", "Therapeutics", "/masters/therapeutics", "Masters"),
    ("masters_document_types", "Document Types", "/masters/document-types", "Masters"),
    ("masters_meals", "Meals", "/masters/meals", "Masters"),
    ("masters_fmv_parameters", "FMV Parameters", "/masters/fmv-parameters", "Masters"),
    ("masters_budget", "Budget", "/masters/budget", "Masters"),
]


def upgrade() -> None:
    # Use raw connection to insert pages that don't exist yet
    conn = op.get_bind()

    for page_key, page_label, page_path, nav_group in MASTER_PAGES:
        # Check if page already exists
        result = conn.execute(
            sa.text("SELECT id FROM pages WHERE page_key = :pk"),
            {"pk": page_key}
        ).fetchone()
        if not result:
            conn.execute(
                sa.text(
                    "INSERT INTO pages (page_key, page_label, page_path, nav_group, is_active) "
                    "VALUES (:pk, :pl, :pp, :ng, true)"
                ),
                {"pk": page_key, "pl": page_label, "pp": page_path, "ng": nav_group}
            )

    # Find all roles that have access to the old 'masters' page and grant them the new sub-pages
    old_masters = conn.execute(
        sa.text("SELECT id FROM pages WHERE page_key = 'masters'")
    ).fetchone()

    if old_masters:
        # Get roles with access to old masters page
        roles_with_access = conn.execute(
            sa.text(
                "SELECT role_id FROM role_page_access WHERE page_id = :pid AND can_access = true"
            ),
            {"pid": old_masters[0]}
        ).fetchall()

        # Get all new master sub-pages
        new_pages = conn.execute(
            sa.text("SELECT id FROM pages WHERE page_key LIKE 'masters_%'")
        ).fetchall()

        # Grant access to each role
        for role_row in roles_with_access:
            for page_row in new_pages:
                existing = conn.execute(
                    sa.text(
                        "SELECT id FROM role_page_access WHERE role_id = :rid AND page_id = :pid"
                    ),
                    {"rid": role_row[0], "pid": page_row[0]}
                ).fetchone()
                if not existing:
                    conn.execute(
                        sa.text(
                            "INSERT INTO role_page_access (role_id, page_id, can_access) "
                            "VALUES (:rid, :pid, true)"
                        ),
                        {"rid": role_row[0], "pid": page_row[0]}
                    )


def downgrade() -> None:
    conn = op.get_bind()
    for page_key, _, _, _ in MASTER_PAGES:
        # Remove access entries first
        conn.execute(
            sa.text(
                "DELETE FROM role_page_access WHERE page_id IN "
                "(SELECT id FROM pages WHERE page_key = :pk)"
            ),
            {"pk": page_key}
        )
        # Remove the page
        conn.execute(
            sa.text("DELETE FROM pages WHERE page_key = :pk"),
            {"pk": page_key}
        )
