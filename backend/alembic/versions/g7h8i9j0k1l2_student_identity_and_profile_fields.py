"""student_identity_and_profile_fields

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-09-16 16:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g7h8i9j0k1l2'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    profile_columns = [col['name'] for col in inspector.get_columns('profiles')]

    if 'magizh_student_id' not in profile_columns:
        op.add_column('profiles', sa.Column('magizh_student_id', sa.String(length=50), nullable=True))
        op.create_index('ix_profiles_magizh_student_id', 'profiles', ['magizh_student_id'], unique=True)

    if 'date_of_birth' not in profile_columns:
        op.add_column('profiles', sa.Column('date_of_birth', sa.String(length=50), nullable=True))

    if 'linkedin_url' not in profile_columns:
        op.add_column('profiles', sa.Column('linkedin_url', sa.String(length=500), nullable=True))

    if 'github_url' not in profile_columns:
        op.add_column('profiles', sa.Column('github_url', sa.String(length=500), nullable=True))

    if 'portfolio_url' not in profile_columns:
        op.add_column('profiles', sa.Column('portfolio_url', sa.String(length=500), nullable=True))

    if 'is_profile_completed' not in profile_columns:
        op.add_column(
            'profiles',
            sa.Column(
                'is_profile_completed',
                sa.Boolean(),
                server_default=sa.text('false'),
                nullable=False,
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    profile_columns = [col['name'] for col in inspector.get_columns('profiles')]

    if 'magizh_student_id' in profile_columns:
        op.drop_index('ix_profiles_magizh_student_id', table_name='profiles')
        op.drop_column('profiles', 'magizh_student_id')

    if 'date_of_birth' in profile_columns:
        op.drop_column('profiles', 'date_of_birth')

    if 'linkedin_url' in profile_columns:
        op.drop_column('profiles', 'linkedin_url')

    if 'github_url' in profile_columns:
        op.drop_column('profiles', 'github_url')

    if 'portfolio_url' in profile_columns:
        op.drop_column('profiles', 'portfolio_url')

    if 'is_profile_completed' in profile_columns:
        op.drop_column('profiles', 'is_profile_completed')
