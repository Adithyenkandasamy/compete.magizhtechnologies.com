"""event_rounds_dynamic_hackathon_stages

Revision ID: 5c9e0a7f2d34
Revises: 1b61d311f481
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5c9e0a7f2d34'
down_revision: Union[str, Sequence[str], None] = '1b61d311f481'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    def _type_exists(name: str) -> bool:
        result = bind.execute(
            sa.text("SELECT to_regtype('public." + name + "') IS NOT NULL")
        )
        return bool(result.scalar())

    # Create the new enum types only if they do not already exist.
    if not _type_exists('roundtype'):
        op.execute(
            "CREATE TYPE roundtype AS ENUM "
            "('QUALIFIER', 'IDEA_SUBMISSION', 'HACK')"
        )
    if not _type_exists('roundstatus'):
        op.execute(
            "CREATE TYPE roundstatus AS ENUM "
            "('UPCOMING', 'OPEN', 'CLOSED')"
        )

    # eventmode already exists from the initial schema migration.
    op.execute(
        """
        CREATE TABLE event_rounds (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            round_type roundtype NOT NULL,
            "order" INTEGER NOT NULL,
            description TEXT,
            criteria_url VARCHAR(2048),
            duration_hours INTEGER,
            mode eventmode,
            starts_at TIMESTAMPTZ,
            ends_at TIMESTAMPTZ,
            status roundstatus NOT NULL DEFAULT 'UPCOMING',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_event_rounds_duration_positive
                CHECK (duration_hours IS NULL OR duration_hours > 0)
        )
        """
    )

    op.execute(
        "CREATE INDEX ix_event_rounds_event_id ON event_rounds (event_id)"
    )
    op.execute(
        "CREATE INDEX ix_event_rounds_status ON event_rounds (status)"
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_event_rounds_event_order "
        "ON event_rounds (event_id, \"order\")"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS uq_event_rounds_event_order")
    op.execute("DROP INDEX IF EXISTS ix_event_rounds_status")
    op.execute("DROP INDEX IF EXISTS ix_event_rounds_event_id")
    op.execute("DROP TABLE IF EXISTS event_rounds")
    op.execute("DROP TYPE IF EXISTS roundstatus")
    op.execute("DROP TYPE IF EXISTS roundtype")