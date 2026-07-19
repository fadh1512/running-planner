from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/recovery", tags=["recovery"])


@router.get("/", response_model=list[schemas.RecoveryLogResponse])
def list_recovery_logs(db: Session = Depends(get_db)):
    return crud.get_recovery_logs(db)


@router.post("/", response_model=schemas.RecoveryLogResponse, status_code=201)
def log_recovery(log: schemas.RecoveryLogCreate, db: Session = Depends(get_db)):
    return crud.create_or_update_recovery_log(db, log)
