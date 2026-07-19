from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app import models

RUNNING_WORKOUT_TYPES = [
    "easy_run", "tempo_run", "interval", "hill_repeats",
    "long_run", "progression_run", "recovery_run",
]


# --- Workouts ---
def get_workouts(db: Session, start_date: date = None, end_date: date = None):
    query = db.query(models.Workout)
    if start_date:
        query = query.filter(models.Workout.date >= start_date)
    if end_date:
        query = query.filter(models.Workout.date <= end_date)
    return query.order_by(models.Workout.date).all()


def get_workout(db: Session, workout_id: int):
    return db.query(models.Workout).filter(models.Workout.id == workout_id).first()


def get_workout_by_date(db: Session, workout_date: date):
    return db.query(models.Workout).filter(models.Workout.date == workout_date).first()


def create_workout(db: Session, workout_data):
    workout_dict = workout_data.model_dump(exclude={"run_details", "strength_details"})
    db_workout = models.Workout(**workout_dict)
    db.add(db_workout)
    db.flush()

    if workout_data.run_details:
        run_detail = models.RunDetail(
            workout_id=db_workout.id,
            **workout_data.run_details.model_dump()
        )
        db.add(run_detail)

    if workout_data.strength_details:
        for sd in workout_data.strength_details:
            strength_detail = models.StrengthDetail(
                workout_id=db_workout.id,
                **sd.model_dump()
            )
            db.add(strength_detail)

    db.commit()
    db.refresh(db_workout)
    return db_workout


def update_workout(db: Session, workout_id: int, workout_data):
    db_workout = get_workout(db, workout_id)
    if not db_workout:
        return None

    update_dict = workout_data.model_dump(exclude_unset=True, exclude={"run_details", "strength_details"})
    for key, value in update_dict.items():
        setattr(db_workout, key, value)

    if workout_data.run_details is not None:
        if db_workout.run_details:
            for key, value in workout_data.run_details.model_dump(exclude_unset=True).items():
                setattr(db_workout.run_details, key, value)
        else:
            run_detail = models.RunDetail(
                workout_id=db_workout.id,
                **workout_data.run_details.model_dump()
            )
            db.add(run_detail)

    if workout_data.strength_details is not None:
        db.query(models.StrengthDetail).filter(
            models.StrengthDetail.workout_id == db_workout.id
        ).delete()
        for sd in workout_data.strength_details:
            strength_detail = models.StrengthDetail(
                workout_id=db_workout.id,
                **sd.model_dump()
            )
            db.add(strength_detail)

    db.commit()
    db.refresh(db_workout)
    return db_workout


def complete_workout(db: Session, workout_id: int):
    db_workout = get_workout(db, workout_id)
    if not db_workout:
        return None
    db_workout.completed = True
    db_workout.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_workout)

    # Auto-detect PRs
    _check_running_prs(db, db_workout)
    _check_strength_prs(db, db_workout)

    return db_workout


def _check_running_prs(db: Session, workout):
    if not workout.run_details:
        return
    rd = workout.run_details
    if rd.distance:
        check_and_create_pr(db, "longest_run", rd.distance, "km", workout.date)
    if rd.actual_pace:
        try:
            parts = rd.actual_pace.split(":")
            pace_val = float(parts[0]) + float(parts[1]) / 60
            check_and_create_pr(db, "fastest_pace", round(pace_val, 2), "min/km", workout.date, lower_is_better=True)
        except (ValueError, IndexError):
            pass
    # Weekly mileage PR is checked via stats
    weekly = _get_current_week_distance(db, workout.date)
    if weekly > 0:
        check_and_create_pr(db, "highest_weekly_km", round(weekly, 1), "km", workout.date)


def _check_strength_prs(db: Session, workout):
    if not workout.strength_details:
        return
    strength_map = {
        "squat": "best_squat",
        "bench press": "best_bench",
        "deadlift": "best_deadlift",
        "pull-ups": "best_pullup",
        "pull ups": "best_pullup",
    }
    for sd in workout.strength_details:
        if sd.weight:
            pr_key = strength_map.get(sd.exercise_name.lower())
            if pr_key:
                check_and_create_pr(db, pr_key, sd.weight, "kg", workout.date)


def _get_current_week_distance(db: Session, ref_date):
    week_start = ref_date - timedelta(days=ref_date.weekday())
    week_end = week_start + timedelta(days=6)
    runs = db.query(models.Workout).filter(
        models.Workout.date >= week_start,
        models.Workout.date <= week_end,
        models.Workout.completed == True,
        models.Workout.workout_type.in_(RUNNING_WORKOUT_TYPES)
    ).all()
    total = 0.0
    for r in runs:
        if r.run_details and r.run_details.distance:
            total += r.run_details.distance
    return total


def delete_workout(db: Session, workout_id: int):
    db_workout = get_workout(db, workout_id)
    if not db_workout:
        return False
    db.delete(db_workout)
    db.commit()
    return True


# --- Workout Templates ---
def get_workout_templates(db: Session, category: str = None):
    query = db.query(models.WorkoutTemplate)
    if category:
        query = query.filter(models.WorkoutTemplate.category == category)
    return query.all()


def get_workout_template(db: Session, template_id: int):
    return db.query(models.WorkoutTemplate).filter(models.WorkoutTemplate.id == template_id).first()


def create_workout_template(db: Session, template_data):
    db_template = models.WorkoutTemplate(**template_data.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


def delete_workout_template(db: Session, template_id: int):
    db_template = get_workout_template(db, template_id)
    if not db_template:
        return False
    db.delete(db_template)
    db.commit()
    return True


# --- Strength Templates ---
def get_strength_templates(db: Session, template_type: str = None):
    query = db.query(models.StrengthTemplate)
    if template_type:
        query = query.filter(models.StrengthTemplate.template_type == template_type)
    return query.all()


def get_strength_template(db: Session, template_id: int):
    return db.query(models.StrengthTemplate).filter(models.StrengthTemplate.id == template_id).first()


def create_strength_template(db: Session, template_data):
    template_dict = template_data.model_dump(exclude={"exercises"})
    db_template = models.StrengthTemplate(**template_dict)
    db.add(db_template)
    db.flush()

    for ex in template_data.exercises:
        exercise = models.StrengthTemplateExercise(
            template_id=db_template.id,
            **ex.model_dump()
        )
        db.add(exercise)

    db.commit()
    db.refresh(db_template)
    return db_template


def delete_strength_template(db: Session, template_id: int):
    db_template = get_strength_template(db, template_id)
    if not db_template:
        return False
    db.delete(db_template)
    db.commit()
    return True


# --- Training Plans ---
def get_training_plans(db: Session):
    return db.query(models.TrainingPlan).order_by(models.TrainingPlan.created_at.desc()).all()


def get_active_plan(db: Session):
    return db.query(models.TrainingPlan).filter(models.TrainingPlan.active == True).first()


def create_training_plan(db: Session, plan_data):
    db_plan = models.TrainingPlan(**plan_data.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


def deactivate_plans(db: Session):
    db.query(models.TrainingPlan).filter(models.TrainingPlan.active == True).update({"active": False})
    db.commit()


# --- Personal Records ---
def get_personal_records(db: Session, category: str = None):
    query = db.query(models.PersonalRecord)
    if category:
        query = query.filter(models.PersonalRecord.category == category)
    return query.order_by(models.PersonalRecord.achieved_at.desc()).all()


def get_best_record(db: Session, category: str):
    return db.query(models.PersonalRecord).filter(
        models.PersonalRecord.category == category
    ).order_by(models.PersonalRecord.value.desc()).first()


def create_personal_record(db: Session, pr_data):
    db_pr = models.PersonalRecord(**pr_data.model_dump())
    db.add(db_pr)
    db.commit()
    db.refresh(db_pr)
    return db_pr


def check_and_create_pr(db: Session, category: str, value: float, unit: str = None, achieved_at: date = None, lower_is_better: bool = False):
    existing = get_best_record(db, category)
    is_new = False
    if existing is None or (lower_is_better and value < existing.value) or (not lower_is_better and value > existing.value):
        pr = models.PersonalRecord(
            category=category,
            value=value,
            unit=unit,
            achieved_at=achieved_at or date.today()
        )
        db.add(pr)
        db.commit()
        db.refresh(pr)
        is_new = True
        return pr, is_new
    return existing, False


# --- Recovery Logs ---
def get_recovery_logs(db: Session, start_date: date = None, end_date: date = None):
    query = db.query(models.RecoveryLog)
    if start_date:
        query = query.filter(models.RecoveryLog.date >= start_date)
    if end_date:
        query = query.filter(models.RecoveryLog.date <= end_date)
    return query.order_by(models.RecoveryLog.date.desc()).all()


def get_recovery_log_by_date(db: Session, log_date: date):
    return db.query(models.RecoveryLog).filter(models.RecoveryLog.date == log_date).first()


def create_or_update_recovery_log(db: Session, log_data):
    existing = get_recovery_log_by_date(db, log_data.date)
    recovery_score = _calculate_recovery_score(
        log_data.sleep_hours,
        log_data.energy_level,
        log_data.muscle_soreness,
        log_data.stress_level
    )

    if existing:
        for key, value in log_data.model_dump().items():
            setattr(existing, key, value)
        existing.recovery_score = recovery_score
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_log = models.RecoveryLog(
            **log_data.model_dump(),
            recovery_score=recovery_score
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log


def _calculate_recovery_score(sleep, energy, soreness, stress):
    score = 50.0
    if sleep is not None:
        if sleep >= 8:
            score += 20
        elif sleep >= 6:
            score += 10
        elif sleep < 5:
            score -= 10
    if energy is not None:
        score += (energy - 5) * 3
    if soreness is not None:
        score += (5 - soreness) * 3
    if stress is not None:
        score += (5 - stress) * 2
    return max(0, min(100, round(score, 1)))


# --- Stats ---
def get_dashboard_stats(db: Session):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    workouts_this_week = db.query(models.Workout).filter(
        and_(models.Workout.date >= week_start, models.Workout.date <= week_end)
    ).all()

    today_workout = db.query(models.Workout).filter(
        models.Workout.date == today
    ).first()

    upcoming = db.query(models.Workout).filter(
        and_(models.Workout.date > today, models.Workout.completed == False)
    ).order_by(models.Workout.date).first()

    weekly_distance = 0.0
    weekly_strength = 0
    completed_count = 0
    for w in workouts_this_week:
        if w.completed:
            completed_count += 1
        if w.run_details and w.run_details.distance:
            weekly_distance += w.run_details.distance
        if w.workout_type.value.startswith("strength_"):
            weekly_strength += 1

    streak = _calculate_streak(db)
    recent_prs = db.query(models.PersonalRecord).order_by(
        models.PersonalRecord.achieved_at.desc()
    ).limit(5).all()

    return {
        "today_workout": today_workout,
        "weekly_distance": round(weekly_distance, 2),
        "weekly_strength_sessions": weekly_strength,
        "weekly_completed": completed_count,
        "weekly_total": len(workouts_this_week),
        "training_streak": streak,
        "recent_prs": recent_prs,
        "upcoming_workout": upcoming,
    }


def get_running_stats(db: Session):
    all_runs = db.query(models.Workout).filter(
        models.Workout.workout_type.in_(RUNNING_WORKOUT_TYPES),
        models.Workout.completed == True
    ).all()

    total_distance = 0.0
    total_time = 0
    longest_run = 0.0
    paces = []

    for run in all_runs:
        if run.run_details:
            if run.run_details.distance:
                total_distance += run.run_details.distance
                longest_run = max(longest_run, run.run_details.distance)
            if run.run_details.duration:
                total_time += run.run_details.duration
            if run.run_details.actual_pace:
                paces.append(run.run_details.actual_pace)

    streak = _calculate_streak(db)
    best_streak = _calculate_best_streak(db)

    if paces:
        total_seconds = 0
        for p in paces:
            parts = p.split(":")
            total_seconds += int(parts[0]) * 60 + int(parts[1])
        avg_seconds = total_seconds / len(paces)
        avg_pace = f"{int(avg_seconds // 60)}:{int(avg_seconds % 60):02d}"
    else:
        avg_pace = None

    return {
        "total_distance": round(total_distance, 2),
        "total_runs": len(all_runs),
        "total_running_time": total_time,
        "average_pace": avg_pace,
        "longest_run": longest_run if longest_run > 0 else None,
        "best_weekly_km": _best_weekly_km(db),
        "current_streak": streak,
        "longest_streak": best_streak,
    }


def get_strength_stats(db: Session):
    strength_workouts = db.query(models.Workout).filter(
        models.Workout.workout_type.in_(["strength_a", "strength_b", "strength_c"]),
        models.Workout.completed == True
    ).all()

    total_exercises = 0
    for sw in strength_workouts:
        total_exercises += len(sw.strength_details)

    top_lifts = []
    for cat in ["best_squat", "best_bench", "best_deadlift", "best_pullup"]:
        pr = db.query(models.PersonalRecord).filter(
            models.PersonalRecord.category == cat
        ).order_by(models.PersonalRecord.value.desc()).first()
        if pr:
            top_lifts.append(pr)

    return {
        "total_sessions": len(strength_workouts),
        "total_exercises": total_exercises,
        "top_lifts": top_lifts,
    }


def _calculate_streak(db: Session):
    today = date.today()
    streak = 0
    current_date = today

    while True:
        workout = db.query(models.Workout).filter(
            and_(models.Workout.date == current_date, models.Workout.completed == True)
        ).first()
        if workout:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break

    return streak


def _calculate_best_streak(db: Session):
    all_completed = db.query(models.Workout).filter(
        models.Workout.completed == True
    ).order_by(models.Workout.date).all()

    if not all_completed:
        return 0

    unique_dates = sorted(set(w.date for w in all_completed))
    best = 0
    current = 1
    for i in range(1, len(unique_dates)):
        if unique_dates[i] == unique_dates[i - 1] + timedelta(days=1):
            current += 1
        else:
            best = max(best, current)
            current = 1
    return max(best, current)


def _best_weekly_km(db: Session):
    all_runs = db.query(models.Workout).filter(
        models.Workout.workout_type.in_(RUNNING_WORKOUT_TYPES),
        models.Workout.completed == True
    ).order_by(models.Workout.date).all()

    if not all_runs:
        return None

    weekly_distances = {}
    for run in all_runs:
        iso_year, week_key, _ = run.date.isocalendar()
        key = f"{iso_year}-{week_key}"
        if key not in weekly_distances:
            weekly_distances[key] = 0.0
        if run.run_details and run.run_details.distance:
            weekly_distances[key] += run.run_details.distance

    return max(weekly_distances.values()) if weekly_distances else None


# --- Seed Data ---
def seed_default_templates(db: Session):
    existing = db.query(models.WorkoutTemplate).count()
    if existing > 0:
        return

    running_templates = [
        models.WorkoutTemplate(
            name="Easy Run",
            category="easy_run",
            description="A comfortable, conversational pace run for building aerobic base.",
            warmup="5 min easy jog + dynamic stretches",
            main_workout="Run at a comfortable, conversational pace",
            cooldown="5 min walk + static stretches",
            estimated_duration=40,
        ),
        models.WorkoutTemplate(
            name="Tempo Run",
            category="tempo_run",
            description="A sustained effort at lactate threshold pace.",
            warmup="10 min easy jog",
            main_workout="20-30 min at tempo pace (comfortably hard)",
            cooldown="10 min easy jog + stretches",
            estimated_duration=45,
        ),
        models.WorkoutTemplate(
            name="Interval Session",
            category="interval",
            description="High-intensity intervals to improve VO2max and speed.",
            warmup="10 min easy jog + 4x strides",
            main_workout="6-8x 800m at 5K pace with 400m jog recovery",
            cooldown="10 min easy jog + stretches",
            estimated_duration=50,
        ),
        models.WorkoutTemplate(
            name="Hill Repeats",
            category="hill_repeats",
            description="Build leg strength and running power with hill repeats.",
            warmup="10 min easy jog on flat ground",
            main_workout="8-10x 60-second hill efforts, jog down recovery",
            cooldown="10 min easy jog + stretches",
            estimated_duration=45,
        ),
        models.WorkoutTemplate(
            name="Long Run",
            category="long_run",
            description="Build endurance with a sustained longer run.",
            warmup="5 min easy jog",
            main_workout="Run at easy pace for the prescribed distance/time",
            cooldown="5 min walk + stretches",
            estimated_duration=90,
        ),
        models.WorkoutTemplate(
            name="Progression Run",
            category="progression_run",
            description="Start easy and progressively increase pace throughout the run.",
            warmup="5 min easy jog",
            main_workout="Start at easy pace, finish last 20% at tempo pace",
            cooldown="5 min walk + stretches",
            estimated_duration=50,
        ),
        models.WorkoutTemplate(
            name="Recovery Run",
            category="recovery_run",
            description="Very easy pace to promote recovery between hard sessions.",
            warmup="5 min walk",
            main_workout="Run at very easy, relaxed pace",
            cooldown="5 min walk + stretches",
            estimated_duration=30,
        ),
    ]

    strength_templates = [
        models.StrengthTemplate(
            name="Strength A - Push Focus",
            template_type="A",
            description="Compound push movements for upper and lower body.",
            exercises=[
                models.StrengthTemplateExercise(exercise_name="Squat", default_sets=4, default_reps=8),
                models.StrengthTemplateExercise(exercise_name="Bench Press", default_sets=4, default_reps=8),
                models.StrengthTemplateExercise(exercise_name="Bent-over Row", default_sets=3, default_reps=10),
                models.StrengthTemplateExercise(exercise_name="Plank", default_sets=3, default_reps=60, notes="hold for seconds"),
            ],
        ),
        models.StrengthTemplate(
            name="Strength B - Pull Focus",
            template_type="B",
            description="Compound pull movements with posterior chain emphasis.",
            exercises=[
                models.StrengthTemplateExercise(exercise_name="Deadlift", default_sets=4, default_reps=6),
                models.StrengthTemplateExercise(exercise_name="Overhead Press", default_sets=4, default_reps=8),
                models.StrengthTemplateExercise(exercise_name="Pull-ups", default_sets=3, default_reps=8),
                models.StrengthTemplateExercise(exercise_name="Bulgarian Split Squat", default_sets=3, default_reps=10),
            ],
        ),
        models.StrengthTemplate(
            name="Strength C - Legs & Core",
            template_type="C",
            description="Single-leg work and core stability for runners.",
            exercises=[
                models.StrengthTemplateExercise(exercise_name="Hip Thrust", default_sets=4, default_reps=10),
                models.StrengthTemplateExercise(exercise_name="Lunges", default_sets=3, default_reps=12),
                models.StrengthTemplateExercise(exercise_name="Farmer Carry", default_sets=3, default_reps=40, notes="walk 40 meters"),
                models.StrengthTemplateExercise(exercise_name="Push-ups", default_sets=3, default_reps=15),
            ],
        ),
    ]

    for t in running_templates:
        db.add(t)
    for t in strength_templates:
        db.add(t)
    db.commit()
