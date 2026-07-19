import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal, Base
from app.routers import workouts, templates, plans, recovery, stats, records
from app.crud import seed_default_templates

logger = logging.getLogger(__name__)


def _run_migrations():
    """Add missing columns to existing tables."""
    with engine.connect() as conn:
        try:
            conn.execute(
                __import__('sqlalchemy').text(
                    "ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS start_day INTEGER DEFAULT 0"
                )
            )
            conn.commit()
        except Exception as e:
            logger.warning("Migration skipped: %s", e)

        try:
            conn.execute(
                __import__('sqlalchemy').text(
                    "ALTER TABLE workouts ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES training_plans(id) ON DELETE SET NULL"
                )
            )
            conn.commit()
        except Exception as e:
            logger.warning("Migration skipped: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    db = SessionLocal()
    try:
        seed_default_templates(db)
    except Exception as e:
        logger.warning("Failed to seed default templates: %s", e)
    finally:
        db.close()
    yield


app = FastAPI(title="Running Planner API", version="1.0.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000",
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workouts.router)
app.include_router(templates.router)
app.include_router(plans.router)
app.include_router(recovery.router)
app.include_router(stats.router)
app.include_router(records.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
