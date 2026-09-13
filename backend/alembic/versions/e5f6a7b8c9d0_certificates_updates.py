"""certificates_updates

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-13 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    columns = [c['name'] for c in inspector.get_columns('certificates')]

    # 1. Alter issued_at to be nullable (None when generated, populated when issued)
    op.alter_column('certificates', 'issued_at', nullable=True, server_default=None)

    # 2. Add created_at if not exists
    if 'created_at' not in columns:
        op.add_column(
            'certificates',
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
        )

    # 3. Add updated_at if not exists
    if 'updated_at' not in columns:
        op.add_column(
            'certificates',
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
        )

    # 4. Add unique constraint (user_id, event_id, certificate_type) if not exists
    uniques = [u['name'] for u in inspector.get_unique_constraints('certificates')]
    if 'uq_certificates_user_event_type' not in uniques:
        op.create_unique_constraint(
            'uq_certificates_user_event_type',
            'certificates',
            ['user_id', 'event_id', 'certificate_type'],
        )

    # 5. Add indexes on certificate_type and issued_at
    indexes = [idx['name'] for idx in inspector.get_indexes('certificates')]
    if 'ix_certificates_certificate_type' not in indexes:
        op.create_index('ix_certificates_certificate_type', 'certificates', ['certificate_type'])
    if 'ix_certificates_issued_at' not in indexes:
        op.create_index('ix_certificates_issued_at', 'certificates', ['issued_at'])


def downgrade() -> None:
    op.drop_index('ix_certificates_issued_at', table_name='certificates')
    op.drop_index('ix_certificates_certificate_type', table_name='certificates')
    op.drop_constraint('uq_certificates_user_event_type', 'certificates', type_='unique')
    op.drop_column('certificates', 'updated_at')
    op.drop_column('certificates', 'created_at')
    op.alter_column('certificates', 'issued_at', nullable=False, server_default=sa.text('now()'))
