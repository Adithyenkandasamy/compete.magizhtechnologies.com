# Comp Backend

FastAPI backend for Comp, the student innovation and event platform.

## Development

- Install dependencies with `uv sync`
- Run the API with `uv run uvicorn main:app --reload`

## Environment

Copy `.env.example` to `.env` and set your database and JWT settings before running locally.

The app connects to PostgreSQL via the `DATABASE_URL` in `.env`. For Supabase, use the asyncpg pooler URL, e.g.:

```
DATABASE_URL=postgresql+asyncpg://postgres.<project-ref>:<DB_PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

On the first run, create the database schema (SQLAlchemy tables + enums) with:

```bash
uv run alembic upgrade head
```

## Admin account

Create or promote an admin user (defaults to `SUPER_ADMIN`) with:

```bash
uv run python -m scripts.create_admin                      # default: admin@magizh.com + generated password
uv run python -m scripts.create_admin --email admin@x.com --password 'S3curePass'
uv run python -m scripts.create_admin --role ADMIN         # ADMIN instead of SUPER_ADMIN
```

The script is idempotent: if the email already exists it promotes the user to the requested role and resets the password. It prints the email/password/role on success.

To log in, use the app's normal `/login` page (or `POST /api/auth/login`) with these credentials. Users with role `ADMIN` or `SUPER_ADMIN` see the admin UI at `/admin`, `/admin/users`, and `/admin/events`.