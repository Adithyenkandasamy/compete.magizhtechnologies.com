"""team_invites_join_requests

Revision ID: a1b2c3d4e5f6
Revises: 5c9e0a7f2d34
Create Date: 2026-09-07 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '5c9e0a7f2d34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Join request status enum
    joinrequeststatus = sa.Enum(
        'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED',
        name='joinrequeststatus',
    )
    joinrequeststatus.create(op.get_bind(), checkfirst=True)

    # team_invites table
    op.create_table(
        'team_invites',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('token_hash', sa.String(64), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_team_invites_token_hash', 'team_invites', ['token_hash'])

    # team_join_requests table
    op.create_table(
        'team_join_requests',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', joinrequeststatus, nullable=False, server_default='PENDING'),
        sa.Column('requested_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('uq_active_team_request', 'team_join_requests', ['team_id', 'user_id'], unique=True,
                     postgresql_where=sa.text("status IN ('PENDING', 'ACCEPTED')"))
    op.create_index('ix_join_requests_team_id', 'team_join_requests', ['team_id'])
    op.create_index('ix_join_requests_user_id', 'team_join_requests', ['user_id'])
    op.create_index('ix_join_requests_status', 'team_join_requests', ['status'])


def downgrade() -> None:
    op.drop_index('ix_join_requests_status', table_name='team_join_requests')
    op.drop_index('ix_join_requests_user_id', table_name='team_join_requests')
    op.drop_index('ix_join_requests_team_id', table_name='team_join_requests')
    op.drop_index('uq_active_team_request', table_name='team_join_requests')
    op.drop_table('team_join_requests')

    op.drop_index('ix_team_invites_token_hash', table_name='team_invites')
    op.drop_table('team_invites')

    sa.Enum(name='joinrequeststatus').drop(op.get_bind(), checkfirst=True)
