from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/records", tags=["personal-records"])


@router.get("/", response_model=list[schemas.PersonalRecordResponse])
def list_records(category: str = None, db: Session = Depends(get_db)):
    return crud.get_personal_records(db, category)


@router.post("/", response_model=schemas.PersonalRecordResponse, status_code=201)
def create_record(record: schemas.PersonalRecordCreate, db: Session = Depends(get_db)):
    return crud.create_personal_record(db, record)
