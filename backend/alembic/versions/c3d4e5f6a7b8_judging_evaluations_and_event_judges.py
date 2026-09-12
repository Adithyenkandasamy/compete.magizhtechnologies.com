"""judging_evaluations_and_event_judges

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-12 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Add JUDGE to userrole enum if not already present
    # Postgres ALTER TYPE ... ADD VALUE cannot run inside transactional block unless handled or executed directly
    # Check if 'JUDGE' is in userrole enum
    res = bind.execute(sa.text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'userrole'"))
    roles = [row[0] for row in res.fetchall()]
    if 'JUDGE' not in roles:
        op.execute("ALTER TYPE userrole ADD VALUE 'JUDGE'")

    # 2. Add is_active column to judges if not exists
    judge_columns = [c['name'] for c in inspector.get_columns('judges')]
    if 'is_active' not in judge_columns:
        op.add_column(
            'judges',
            sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False)
        )

    # 3. Create event_judges table if not exists
    tables = inspector.get_table_names()
    if 'event_judges' not in tables:
        op.create_table(
            'event_judges',
            sa.Column('event_id', UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('judge_id', UUID(as_uuid=True), sa.ForeignKey('judges.id', ondelete='CASCADE'), primary_key=True, nullable=False),
            sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('assigned_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        )
        op.create_index('ix_event_judges_event_id', 'event_judges', ['event_id'])
        op.create_index('ix_event_judges_judge_id', 'event_judges', ['judge_id'])

    # 4. Add index on evaluations(created_at) if not exists
    eval_indexes = [idx['name'] for idx in inspector.get_indexes('evaluations')]
    if 'ix_evaluations_created_at' not in eval_indexes:
        op.create_index('ix_evaluations_created_at', 'evaluations', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_evaluations_created_at', table_name='evaluations')
    op.drop_index('ix_event_judges_judge_id', table_name='event_judges')
    op.drop_index('ix_event_judges_event_id', table_name='event_judges')
    op.drop_table('event_judges')
    op.drop_column('judges', 'is_active')
