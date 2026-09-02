# compete.magizhtechnologies.com

## Running with Docker

You can run the application either as separate containers or together using Docker Compose.

### Option 1: Run Both Together (Recommended)
This will start the PostgreSQL database, the FastAPI backend, and the React frontend all at once.
```bash
docker compose up --build
```
- Frontend will be available at: http://localhost:3000
- Backend will be available at: http://localhost:8000

### Option 2: Run Separately

**To run only the Backend:**
```bash
cd backend
docker build -t comp-backend .
docker run -p 8000:8000 --env-file .env comp-backend
```

**To run only the Frontend:**
```bash
cd frontend
docker build -t comp-frontend .
docker run -p 3000:80 comp-frontend
```




<!-- uv run python -m scripts.create_admin --email admin@magizh.com --password 'NewPass'  -->