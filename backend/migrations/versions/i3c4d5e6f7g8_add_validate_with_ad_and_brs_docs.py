"""add validate_with_ad column and brs_application_documents table

Revision ID: i3c4d5e6f7g8
Revises: h2b3c4d5e6f7
Create Date: 2026-05-18 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'i3c4d5e6f7g8'
down_revision: Union[str, None] = 'h2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add validate_with_ad column to users
    op.add_column('users', sa.Column('validate_with_ad', sa.Boolean(), server_default='false', nullable=True))

    # Create brs_application_documents table
    op.create_table(
        'brs_application_documents',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('brs_application_id', sa.Integer(), sa.ForeignKey('brs_applications.id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_name', sa.String(300), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('uploaded_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('brs_application_documents')
    op.drop_column('users', 'validate_with_ad')
