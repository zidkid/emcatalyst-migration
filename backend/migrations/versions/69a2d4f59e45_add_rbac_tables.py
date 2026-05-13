"""add rbac tables

Revision ID: 69a2d4f59e45
Revises: 
Create Date: 2026-05-13 22:05:17.015369

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '69a2d4f59e45'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('pages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('page_key', sa.String(length=100), nullable=False),
        sa.Column('page_label', sa.String(length=200), nullable=False),
        sa.Column('page_path', sa.String(length=300), nullable=False),
        sa.Column('nav_group', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pages_id'), 'pages', ['id'], unique=False)
    op.create_index(op.f('ix_pages_page_key'), 'pages', ['page_key'], unique=True)

    op.create_table('roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)

    op.create_table('role_page_access',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('page_id', sa.Integer(), nullable=False),
        sa.Column('can_access', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_role_page_access_id'), 'role_page_access', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_role_page_access_id'), table_name='role_page_access')
    op.drop_table('role_page_access')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')
    op.drop_index(op.f('ix_pages_page_key'), table_name='pages')
    op.drop_index(op.f('ix_pages_id'), table_name='pages')
    op.drop_table('pages')
