"""event_results_and_leaderboard

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-12 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Add results_published and results_published_at to events
    event_columns = [c['name'] for c in inspector.get_columns('events')]
    if 'results_published' not in event_columns:
        op.add_column(
            'events',
            sa.Column('results_published', sa.Boolean(), server_default=sa.text('false'), nullable=False)
        )
    if 'results_published_at' not in event_columns:
        op.add_column(
            'events',
            sa.Column('results_published_at', sa.DateTime(timezone=True), nullable=True)
        )

    # 2. Add index on events(results_published)
    event_indexes = [idx['name'] for idx in inspector.get_indexes('events')]
    if 'ix_events_results_published' not in event_indexes:
        op.create_index('ix_events_results_published', 'events', ['results_published'])

    # 3. Create event_results table
    tables = inspector.get_table_names()
    if 'event_results' not in tables:
        op.create_table(
            'event_results',
            sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), nullable=False),
            sa.Column('event_id', UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
            sa.Column('submission_id', UUID(as_uuid=True), sa.ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False),
            sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
            sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
            sa.Column('rank', sa.Integer(), nullable=False),
            sa.Column('final_score', sa.Numeric(5, 2), nullable=False),
            sa.Column('innovation_score', sa.Numeric(5, 2), nullable=True),
            sa.Column('technical_score', sa.Numeric(5, 2), nullable=True),
            sa.Column('impact_score', sa.Numeric(5, 2), nullable=True),
            sa.Column('uiux_score', sa.Numeric(5, 2), nullable=True),
            sa.Column('presentation_score', sa.Numeric(5, 2), nullable=True),
            sa.Column('evaluations_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
            sa.Column('award', sa.String(100), nullable=True),
            sa.Column('is_winner', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('is_published', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint('event_id', 'submission_id', name='uq_event_results_event_submission'),
            sa.UniqueConstraint('event_id', 'rank', name='uq_event_results_event_rank'),
        )
        op.create_index('ix_event_results_event_id', 'event_results', ['event_id'])
        op.create_index('ix_event_results_submission_id', 'event_results', ['submission_id'])
        op.create_index('ix_event_results_project_id', 'event_results', ['project_id'])
        op.create_index('ix_event_results_team_id', 'event_results', ['team_id'])
        op.create_index('ix_event_results_rank', 'event_results', ['rank'])
        op.create_index('ix_event_results_is_published', 'event_results', ['is_published'])


def downgrade() -> None:
    op.drop_index('ix_event_results_is_published', table_name='event_results')
    op.drop_index('ix_event_results_rank', table_name='event_results')
    op.drop_index('ix_event_results_team_id', table_name='event_results')
    op.drop_index('ix_event_results_project_id', table_name='event_results')
    op.drop_index('ix_event_results_submission_id', table_name='event_results')
    op.drop_index('ix_event_results_event_id', table_name='event_results')
    op.drop_table('event_results')
    op.drop_index('ix_events_results_published', table_name='events')
    op.drop_column('events', 'results_published_at')
    op.drop_column('events', 'results_published')
