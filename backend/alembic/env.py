"""
Alembic environment configuration.

Configured for async SQLAlchemy (asyncpg) with settings pulled from
app.core.config so there is a single source of truth for DATABASE_URL.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ---------------------------------------------------------------------------
# Alembic config object
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file's logging settings.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Pull DATABASE_URL from our app settings (overrides alembic.ini value)
# ---------------------------------------------------------------------------
from app.core.config import settings  # noqa: E402

config.set_main_option("sqlalchemy.url", settings.database_url)

# ---------------------------------------------------------------------------
# Import all models here so autogenerate can detect schema changes.
# Example (add as you create models):
#   from app.models.user import User  # noqa: F401
# ---------------------------------------------------------------------------
from app.database.session import Base  # noqa: E402, F401

target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Offline mode (generate SQL scripts without a live DB connection)
# ---------------------------------------------------------------------------


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online mode (apply migrations against a live DB)
# ---------------------------------------------------------------------------


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
