from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas
from app.plan_generator import generate_workouts_for_plan

router = APIRouter(prefix="/api/plans", tags=["training-plans"])


@router.get("/", response_model=list[schemas.TrainingPlanResponse])
def list_plans(db: Session = Depends(get_db)):
    return crud.get_training_plans(db)


@router.get("/active", response_model=schemas.TrainingPlanResponse)
def get_active_plan(db: Session = Depends(get_db)):
    plan = crud.get_active_plan(db)
    if not plan:
        raise HTTPException(status_code=404, detail="No active training plan")
    return plan


@router.post("/", response_model=schemas.TrainingPlanResponse, status_code=201)
def create_plan(plan: schemas.TrainingPlanCreate, db: Session = Depends(get_db)):
    crud.deactivate_plans(db)
    db_plan = crud.create_training_plan(db, plan)
    generate_workouts_for_plan(db, db_plan)
    return db_plan


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    crud.delete_plan(db, plan_id)
