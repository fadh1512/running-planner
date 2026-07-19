# Running Planner

A full-stack running and strength training planner built with React, FastAPI, and PostgreSQL.

## Features

- **Dashboard** - Today's workout, weekly stats, training streak, personal records
- **Calendar** - Monthly view with color-coded workouts, click to create/edit/complete
- **Templates** - Pre-built running and strength workout templates
- **Progress Tracking** - Weekly distance charts, workout history, PR tracking
- **Statistics** - Running stats, strength stats, streak tracking
- **Recovery Tracker** - Daily recovery questionnaire with calculated recovery score
- **Plan Generator** - Create training plans for 5K, 10K, Half Marathon, or Marathon

## Tech Stack

**Frontend:** React 18, TypeScript, Tailwind CSS, FullCalendar, Recharts
**Backend:** Python, FastAPI, SQLAlchemy, Alembic
**Database:** PostgreSQL

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### 1. Database

```bash
# Create the database
createdb running_planner
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure database (edit .env)
cp .env.example .env
# Update DATABASE_URL if needed

# Start the server (creates tables automatically)
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts/` | List workouts (optional ?start_date=&end_date=) |
| POST | `/api/workouts/` | Create workout |
| PUT | `/api/workouts/{id}` | Update workout |
| PATCH | `/api/workouts/{id}/complete` | Mark workout complete |
| DELETE | `/api/workouts/{id}` | Delete workout |
| GET | `/api/templates/running` | List running templates |
| POST | `/api/templates/running` | Create running template |
| GET | `/api/templates/strength` | List strength templates |
| POST | `/api/templates/strength` | Create strength template |
| GET | `/api/plans/` | List training plans |
| POST | `/api/plans/` | Create training plan |
| GET | `/api/stats/dashboard` | Dashboard statistics |
| GET | `/api/stats/running` | Running statistics |
| GET | `/api/stats/strength` | Strength statistics |
| GET | `/api/records/` | List personal records |
| GET | `/api/recovery/` | List recovery logs |
| POST | `/api/recovery/` | Log recovery data |

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set root directory to `frontend`
4. Deploy

### Backend (Railway)
1. Import repo on [railway.app](https://railway.app)
2. Set root directory to `backend`
3. Add PostgreSQL database in Railway
4. Set `DATABASE_URL` env var
5. Deploy

See `DOCUMENTATION.md` for detailed deployment instructions.
