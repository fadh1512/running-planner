from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.get("/", response_model=list[schemas.WorkoutResponse])
def list_workouts(
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    return crud.get_workouts(db, start_date, end_date)


@router.get("/{workout_id}", response_model=schemas.WorkoutResponse)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = crud.get_workout(db, workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.post("/", response_model=schemas.WorkoutResponse, status_code=201)
def create_workout(workout: schemas.WorkoutCreate, db: Session = Depends(get_db)):
    return crud.create_workout(db, workout)


@router.put("/{workout_id}", response_model=schemas.WorkoutResponse)
def update_workout(workout_id: int, workout: schemas.WorkoutUpdate, db: Session = Depends(get_db)):
    updated = crud.update_workout(db, workout_id, workout)
    if not updated:
        raise HTTPException(status_code=404, detail="Workout not found")
    return updated


@router.patch("/{workout_id}/complete", response_model=schemas.WorkoutResponse)
def complete_workout(workout_id: int, db: Session = Depends(get_db)):
    completed = crud.complete_workout(db, workout_id)
    if not completed:
        raise HTTPException(status_code=404, detail="Workout not found")
    return completed


@router.delete("/{workout_id}", status_code=204)
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    if not crud.delete_workout(db, workout_id):
        raise HTTPException(status_code=404, detail="Workout not found")
