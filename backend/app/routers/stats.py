from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@router.get("/running", response_model=schemas.RunningStats)
def running_stats(db: Session = Depends(get_db)):
    return crud.get_running_stats(db)


@router.get("/strength", response_model=schemas.StrengthStats)
def strength_stats(db: Session = Depends(get_db)):
    return crud.get_strength_stats(db)
