from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/templates", tags=["templates"])


# --- Running Workout Templates ---
@router.get("/running", response_model=list[schemas.WorkoutTemplateResponse])
def list_running_templates(category: str = None, db: Session = Depends(get_db)):
    return crud.get_workout_templates(db, category)


@router.get("/running/{template_id}", response_model=schemas.WorkoutTemplateResponse)
def get_running_template(template_id: int, db: Session = Depends(get_db)):
    template = crud.get_workout_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/running", response_model=schemas.WorkoutTemplateResponse, status_code=201)
def create_running_template(template: schemas.WorkoutTemplateCreate, db: Session = Depends(get_db)):
    return crud.create_workout_template(db, template)


@router.delete("/running/{template_id}", status_code=204)
def delete_running_template(template_id: int, db: Session = Depends(get_db)):
    if not crud.delete_workout_template(db, template_id):
        raise HTTPException(status_code=404, detail="Template not found")


# --- Strength Templates ---
@router.get("/strength", response_model=list[schemas.StrengthTemplateResponse])
def list_strength_templates(template_type: str = None, db: Session = Depends(get_db)):
    return crud.get_strength_templates(db, template_type)


@router.get("/strength/{template_id}", response_model=schemas.StrengthTemplateResponse)
def get_strength_template(template_id: int, db: Session = Depends(get_db)):
    template = crud.get_strength_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/strength", response_model=schemas.StrengthTemplateResponse, status_code=201)
def create_strength_template(template: schemas.StrengthTemplateCreate, db: Session = Depends(get_db)):
    return crud.create_strength_template(db, template)


@router.delete("/strength/{template_id}", status_code=204)
def delete_strength_template(template_id: int, db: Session = Depends(get_db)):
    if not crud.delete_strength_template(db, template_id):
        raise HTTPException(status_code=404, detail="Template not found")
