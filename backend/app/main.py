import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal, Base
from app.routers import workouts, templates, plans, recovery, stats, records
from app.crud import seed_default_templates

app = FastAPI(title="Running Planner API", version="1.0.0")

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


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_templates(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
