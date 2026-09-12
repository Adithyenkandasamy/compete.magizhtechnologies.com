"""submissions_constraints_created_at

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-12 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Add created_at column if not already present
    columns = [c['name'] for c in inspector.get_columns('submissions')]
    if 'created_at' not in columns:
        op.add_column(
            'submissions',
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
        )

    # Ensure unique constraint on project_id (one submission per project)
    unique_constraints = [c['name'] for c in inspector.get_unique_constraints('submissions')]
    if 'uq_submissions_project_id' not in unique_constraints:
        op.create_unique_constraint(
            'uq_submissions_project_id',
            'submissions',
            ['project_id']
        )


def downgrade() -> None:
    op.drop_constraint('uq_submissions_project_id', 'submissions', type_='unique')
    op.drop_column('submissions', 'created_at')
