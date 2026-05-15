"""add survey_doctor_mappings table

Revision ID: f9a0b1c2d3e4
Revises: e8f9a0b1c2d3
Create Date: 2026-05-14 05:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f9a0b1c2d3e4'
down_revision: Union[str, None] = 'e8f9a0b1c2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('survey_doctor_mappings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('survey_id', sa.Integer(), nullable=False),
        sa.Column('hcp_doctor_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['survey_id'], ['brs_surveys.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['hcp_doctor_id'], ['hcp_doctors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_survey_doctor_mappings_id', 'survey_doctor_mappings', ['id'], unique=False)
    op.create_index('ix_survey_doctor_mappings_survey_id', 'survey_doctor_mappings', ['survey_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_survey_doctor_mappings_survey_id', table_name='survey_doctor_mappings')
    op.drop_index('ix_survey_doctor_mappings_id', table_name='survey_doctor_mappings')
    op.drop_table('survey_doctor_mappings')
