# Magizh Innovation API

Official event and innovation platform backend for **Magizh Technologies**.

Built with **FastAPI · SQLAlchemy (async) · asyncpg · Pydantic · Alembic**.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | ≥ 3.11 |
| pip | latest |
| PostgreSQL (Supabase) | any |

---

## Quick start

### 1. Clone and enter the project

```bash
git clone <repo-url>
cd compete.magizhtechnologies.com
```

### 2. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your real values:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
JWT_SECRET=<generate a strong random secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:3000
```

> **Never commit `.env` to version control.**

### 5. Run the development server

```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Verify

| Endpoint | Expected response |
|----------|------------------|
| `GET /` | `{"name":"Magizh Innovation API","status":"running"}` |
| `GET /api/health` | `{"status":"ok"}` |

Interactive docs: <http://localhost:8000/docs>

---

## Database migrations (Alembic)

> **DATABASE_URL is read from `.env` automatically — no editing of `alembic.ini` needed.**

```bash
# Create a new migration
alembic revision --autogenerate -m "describe change"

# Apply all pending migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

---

## Project structure

```
app/
├── main.py               # Application factory, middleware, routers
├── core/
│   ├── config.py         # Settings (pydantic-settings, reads .env)
│   └── logging.py        # Logging configuration
├── database/
│   └── session.py        # Async engine, session factory, Base, get_db
├── models/               # SQLAlchemy ORM models (Phase 2+)
├── schemas/              # Pydantic request/response schemas (Phase 2+)
├── repositories/         # Database access layer (Phase 2+)
├── services/             # Business logic layer (Phase 2+)
├── api/
│   └── health.py         # GET /api/health
├── auth/                 # JWT authentication (Phase 2+)
├── websocket/            # WebSocket handlers (Phase 2+)
└── middleware/
    └── error_handler.py  # Global exception → JSON response
alembic/                  # Database migration scripts
```

---

## Environment variables reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | asyncpg connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs |
| `JWT_ALGORITHM` | | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | `60` | Token TTL in minutes |
| `FRONTEND_URL` | | `http://localhost:3000` | Allowed CORS origin |
