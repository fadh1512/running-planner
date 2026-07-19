from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# --- Run Details ---
class RunDetailBase(BaseModel):
    distance: Optional[float] = None
    target_pace: Optional[str] = None
    actual_pace: Optional[str] = None
    duration: Optional[int] = None
    elevation_gain: Optional[float] = None
    heart_rate_avg: Optional[int] = None


class RunDetailCreate(RunDetailBase):
    pass


class RunDetailResponse(RunDetailBase):
    id: int
    workout_id: int

    class Config:
        from_attributes = True


# --- Strength Details ---
class StrengthDetailBase(BaseModel):
    exercise_name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None
    rest_time: Optional[int] = None
    notes: Optional[str] = None


class StrengthDetailCreate(StrengthDetailBase):
    pass


class StrengthDetailResponse(StrengthDetailBase):
    id: int
    workout_id: int

    class Config:
        from_attributes = True


# --- Workouts ---
class WorkoutBase(BaseModel):
    title: str
    workout_type: str
    date: date
    notes: Optional[str] = None
    estimated_duration: Optional[int] = None


class WorkoutCreate(WorkoutBase):
    completed: bool = False
    run_details: Optional[RunDetailCreate] = None
    strength_details: Optional[list[StrengthDetailCreate]] = None


class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    workout_type: Optional[str] = None
    date: Optional[date] = None
    completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    estimated_duration: Optional[int] = None
    run_details: Optional[RunDetailCreate] = None
    strength_details: Optional[list[StrengthDetailCreate]] = None


class WorkoutResponse(WorkoutBase):
    id: int
    completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    run_details: Optional[RunDetailResponse] = None
    strength_details: list[StrengthDetailResponse] = []

    class Config:
        from_attributes = True


# --- Workout Templates ---
class WorkoutTemplateBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    warmup: Optional[str] = None
    main_workout: Optional[str] = None
    cooldown: Optional[str] = None
    target_pace: Optional[str] = None
    estimated_duration: Optional[int] = None


class WorkoutTemplateCreate(WorkoutTemplateBase):
    pass


class WorkoutTemplateResponse(WorkoutTemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Strength Templates ---
class StrengthTemplateExerciseBase(BaseModel):
    exercise_name: str
    default_sets: Optional[int] = None
    default_reps: Optional[int] = None
    default_weight: Optional[float] = None
    notes: Optional[str] = None


class StrengthTemplateExerciseCreate(StrengthTemplateExerciseBase):
    pass


class StrengthTemplateExerciseResponse(StrengthTemplateExerciseBase):
    id: int
    template_id: int

    class Config:
        from_attributes = True


class StrengthTemplateBase(BaseModel):
    name: str
    template_type: str
    description: Optional[str] = None


class StrengthTemplateCreate(StrengthTemplateBase):
    exercises: list[StrengthTemplateExerciseCreate] = []


class StrengthTemplateResponse(StrengthTemplateBase):
    id: int
    created_at: datetime
    exercises: list[StrengthTemplateExerciseResponse] = []

    class Config:
        from_attributes = True


# --- Training Plans ---
class TrainingPlanBase(BaseModel):
    goal: str
    start_date: date
    end_date: date
    current_weekly_km: Optional[float] = None
    fitness_level: Optional[str] = None
    training_days: Optional[int] = None
    strength_sessions: Optional[int] = None
    start_day: Optional[int] = None  # 0=Mon, 1=Tue, ..., 6=Sun


class TrainingPlanCreate(TrainingPlanBase):
    pass


class TrainingPlanResponse(TrainingPlanBase):
    id: int
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Personal Records ---
class PersonalRecordBase(BaseModel):
    category: str
    value: float
    unit: Optional[str] = None
    achieved_at: Optional[date] = None


class PersonalRecordCreate(PersonalRecordBase):
    pass


class PersonalRecordResponse(PersonalRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Recovery Logs ---
class RecoveryLogBase(BaseModel):
    date: date
    sleep_hours: Optional[float] = None
    energy_level: Optional[int] = None
    muscle_soreness: Optional[int] = None
    stress_level: Optional[int] = None
    notes: Optional[str] = None


class RecoveryLogCreate(RecoveryLogBase):
    pass


class RecoveryLogResponse(RecoveryLogBase):
    id: int
    recovery_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Stats ---
class DashboardStats(BaseModel):
    today_workout: Optional[WorkoutResponse] = None
    weekly_distance: float = 0.0
    weekly_strength_sessions: int = 0
    weekly_completed: int = 0
    weekly_total: int = 0
    training_streak: int = 0
    recent_prs: list[PersonalRecordResponse] = []
    upcoming_workout: Optional[WorkoutResponse] = None


class RunningStats(BaseModel):
    total_distance: float = 0.0
    total_runs: int = 0
    total_running_time: int = 0  # minutes
    average_pace: Optional[str] = None
    longest_run: Optional[float] = None
    best_weekly_km: Optional[float] = None
    current_streak: int = 0
    longest_streak: int = 0


class StrengthStats(BaseModel):
    total_sessions: int = 0
    total_exercises: int = 0
    top_lifts: list[PersonalRecordResponse] = []
