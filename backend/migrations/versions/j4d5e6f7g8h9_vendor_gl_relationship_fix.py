"""fix vendor GL account relationships - restructure FKs

Revision ID: j4d5e6f7g8h9
Revises: i3c4d5e6f7g8
Create Date: 2026-05-18 10:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'j4d5e6f7g8h9'
down_revision: Union[str, None] = 'i3c4d5e6f7g8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Old structure: OrderNumber -> TypeOfService (order_number_id) -> GLAccount (type_of_service_id)
    # New structure: GLAccount -> TypeOfService (gl_account_id) -> OrderNumber (type_of_service_id)

    # Drop old FKs (if they exist)
    try:
        op.drop_constraint('vendor_type_of_services_order_number_id_fkey', 'vendor_type_of_services', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('vendor_gl_accounts_type_of_service_id_fkey', 'vendor_gl_accounts', type_='foreignkey')
    except Exception:
        pass

    # Drop old columns (if they exist)
    try:
        op.drop_column('vendor_type_of_services', 'order_number_id')
    except Exception:
        pass
    try:
        op.drop_column('vendor_gl_accounts', 'type_of_service_id')
    except Exception:
        pass

    # Add new columns with correct relationships
    # GLAccount is parent -> TypeOfService has gl_account_id
    try:
        op.add_column('vendor_type_of_services',
                      sa.Column('gl_account_id', sa.Integer(),
                                sa.ForeignKey('vendor_gl_accounts.id', ondelete='CASCADE'), nullable=True))
    except Exception:
        pass

    # TypeOfService is parent -> OrderNumber has type_of_service_id
    try:
        op.add_column('vendor_order_numbers',
                      sa.Column('type_of_service_id', sa.Integer(),
                                sa.ForeignKey('vendor_type_of_services.id', ondelete='CASCADE'), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    # Revert: remove new columns, add old ones back
    try:
        op.drop_column('vendor_order_numbers', 'type_of_service_id')
    except Exception:
        pass
    try:
        op.drop_column('vendor_type_of_services', 'gl_account_id')
    except Exception:
        pass

    # Restore old structure
    op.add_column('vendor_type_of_services',
                  sa.Column('order_number_id', sa.Integer(),
                            sa.ForeignKey('vendor_order_numbers.id', ondelete='CASCADE'), nullable=True))
    op.add_column('vendor_gl_accounts',
                  sa.Column('type_of_service_id', sa.Integer(),
                            sa.ForeignKey('vendor_type_of_services.id', ondelete='CASCADE'), nullable=True))
