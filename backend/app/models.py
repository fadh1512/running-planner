import enum
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime,
    Enum, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base


class WorkoutTypeEnum(str, enum.Enum):
    EASY_RUN = "easy_run"
    TEMPO_RUN = "tempo_run"
    INTERVAL = "interval"
    HILL_REPEATS = "hill_repeats"
    LONG_RUN = "long_run"
    PROGRESSION_RUN = "progression_run"
    RECOVERY_RUN = "recovery_run"
    STRENGTH_A = "strength_a"
    STRENGTH_B = "strength_b"
    STRENGTH_C = "strength_c"
    REST_DAY = "rest_day"
    CUSTOM = "custom"


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    workout_type = Column(Enum(WorkoutTypeEnum), nullable=False)
    date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    estimated_duration = Column(Integer, nullable=True)  # minutes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    run_details = relationship("RunDetail", back_populates="workout", uselist=False, cascade="all, delete-orphan")
    strength_details = relationship("StrengthDetail", back_populates="workout", cascade="all, delete-orphan")


class RunDetail(Base):
    __tablename__ = "run_details"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), unique=True, nullable=False)
    distance = Column(Float, nullable=True)  # km
    target_pace = Column(String(20), nullable=True)  # min/km
    actual_pace = Column(String(20), nullable=True)
    duration = Column(Integer, nullable=True)  # minutes
    elevation_gain = Column(Float, nullable=True)  # meters
    heart_rate_avg = Column(Integer, nullable=True)

    workout = relationship("Workout", back_populates="run_details")


class StrengthDetail(Base):
    __tablename__ = "strength_details"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    exercise_name = Column(String(255), nullable=False)
    sets = Column(Integer, nullable=True)
    reps = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)  # kg
    rest_time = Column(Integer, nullable=True)  # seconds
    notes = Column(Text, nullable=True)

    workout = relationship("Workout", back_populates="strength_details")


class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(Enum(WorkoutTypeEnum), nullable=False)
    description = Column(Text, nullable=True)
    warmup = Column(Text, nullable=True)
    main_workout = Column(Text, nullable=True)
    cooldown = Column(Text, nullable=True)
    target_pace = Column(String(20), nullable=True)
    estimated_duration = Column(Integer, nullable=True)  # minutes
    created_at = Column(DateTime, default=datetime.utcnow)


class StrengthTemplate(Base):
    __tablename__ = "strength_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    template_type = Column(String(50), nullable=False)  # A, B, C
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    exercises = relationship("StrengthTemplateExercise", back_populates="template", cascade="all, delete-orphan")


class StrengthTemplateExercise(Base):
    __tablename__ = "strength_template_exercises"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("strength_templates.id", ondelete="CASCADE"), nullable=False)
    exercise_name = Column(String(255), nullable=False)
    default_sets = Column(Integer, nullable=True)
    default_reps = Column(Integer, nullable=True)
    default_weight = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    template = relationship("StrengthTemplate", back_populates="exercises")


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, index=True)
    goal = Column(String(50), nullable=False)  # 5k, 10k, half_marathon, marathon
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    current_weekly_km = Column(Float, nullable=True)
    fitness_level = Column(String(50), nullable=True)  # beginner, intermediate, advanced
    training_days = Column(Integer, nullable=True)
    strength_sessions = Column(Integer, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)  # fastest_5k, best_squat, etc.
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=True)  # min, kg, km
    achieved_at = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecoveryLog(Base):
    __tablename__ = "recovery_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    sleep_hours = Column(Float, nullable=True)
    energy_level = Column(Integer, nullable=True)  # 1-10
    muscle_soreness = Column(Integer, nullable=True)  # 1-10
    stress_level = Column(Integer, nullable=True)  # 1-10
    recovery_score = Column(Float, nullable=True)  # calculated 0-100
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
