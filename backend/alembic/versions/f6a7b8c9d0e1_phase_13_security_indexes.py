"""phase_13_security_indexes

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Audit logs: index on action
    audit_indexes = [idx['name'] for idx in inspector.get_indexes('audit_logs')]
    if 'ix_audit_logs_action' not in audit_indexes:
        op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])

    # 2. Login attempts: index on success
    login_indexes = [idx['name'] for idx in inspector.get_indexes('login_attempts')]
    if 'ix_login_attempts_success' not in login_indexes:
        op.create_index('ix_login_attempts_success', 'login_attempts', ['success'])

    # 3. User sessions: index on revoked_at
    session_indexes = [idx['name'] for idx in inspector.get_indexes('user_sessions')]
    if 'ix_user_sessions_revoked_at' not in session_indexes:
        op.create_index('ix_user_sessions_revoked_at', 'user_sessions', ['revoked_at'])

    # 4. Security alerts: index on type
    alert_indexes = [idx['name'] for idx in inspector.get_indexes('security_alerts')]
    if 'ix_security_alerts_type' not in alert_indexes:
        op.create_index('ix_security_alerts_type', 'security_alerts', ['type'])


def downgrade() -> None:
    op.drop_index('ix_security_alerts_type', table_name='security_alerts')
    op.drop_index('ix_user_sessions_revoked_at', table_name='user_sessions')
    op.drop_index('ix_login_attempts_success', table_name='login_attempts')
    op.drop_index('ix_audit_logs_action', table_name='audit_logs')
