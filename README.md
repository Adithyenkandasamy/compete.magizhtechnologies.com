# Magizh Innovation

Official event and innovation platform for **Magizh Technologies**.

---

## Repository structure

```
compete.magizhtechnologies.com/
├── backend/          # FastAPI · SQLAlchemy · asyncpg · Alembic
└── frontend/         # Next.js (coming soon)
```

---

## Backend

See [`backend/README.md`](./backend/README.md) for full setup instructions.

**Quick start:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET …
uvicorn app.main:app --reload --port 8000
```

Endpoints:

| Method | Path | Response |
|--------|------|----------|
| GET | `/` | `{"name":"Magizh Innovation API","status":"running"}` |
| GET | `/api/health` | `{"status":"ok"}` |

---

## Frontend

> 🚧 Coming in a future phase.

The frontend will be a Next.js application that connects to the backend API.

```bash
cd frontend
# npm install
# npm run dev
```
