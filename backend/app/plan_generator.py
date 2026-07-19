import math
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app import models


def generate_workouts_for_plan(db: Session, plan: models.TrainingPlan):
    """Generate weekly workout schedule based on training plan parameters."""
    goal = plan.goal
    start = plan.start_date
    end = plan.end_date
    training_days = plan.training_days or 5
    strength_sessions = plan.strength_sessions or 2
    fitness = plan.fitness_level or "intermediate"
    base_km = plan.current_weekly_km or 20
    start_day = plan.start_day or 0  # 0=Mon, 6=Sun

    total_weeks = max(1, math.ceil((end - start).days / 7))

    long_run_targets = {
        "5k": {"beginner": 8, "intermediate": 10, "advanced": 12},
        "10k": {"beginner": 12, "intermediate": 15, "advanced": 18},
        "half_marathon": {"beginner": 16, "intermediate": 20, "advanced": 24},
        "marathon": {"beginner": 24, "intermediate": 30, "advanced": 35},
    }

    easy_run_km = {
        "5k": {"beginner": 3, "intermediate": 5, "advanced": 6},
        "10k": {"beginner": 5, "intermediate": 6, "advanced": 8},
        "half_marathon": {"beginner": 6, "intermediate": 8, "advanced": 10},
        "marathon": {"beginner": 8, "intermediate": 10, "advanced": 12},
    }

    target_long = long_run_targets.get(goal, {}).get(fitness, 15)
    target_easy = easy_run_km.get(goal, {}).get(fitness, 5)

    day_types = _build_weekly_pattern(training_days, strength_sessions, start_day)

    current_date = start
    week_num = 0

    while current_date <= end and week_num < total_weeks:
        progress = week_num / max(1, total_weeks - 1)
        is_taper = week_num >= total_weeks - 2

        for day_offset, workout_type in day_types:
            workout_date = current_date + timedelta(days=day_offset)
            if workout_date > end:
                break

            workout = _create_workout_for_day(
                db, plan, workout_date, workout_type, week_num,
                progress, is_taper, target_long, target_easy
            )
            if workout:
                db.add(workout)

        current_date += timedelta(days=7)
        week_num += 1

    db.commit()


def _build_weekly_pattern(training_days, strength_sessions, start_day=0):
    """Build a weekly pattern of workout types, offset by start_day.

    start_day: 0=Monday, 1=Tuesday, ..., 6=Sunday
    The pattern offsets are relative to the start of each week (Monday=0).
    We subtract start_day so the first training day falls on the chosen day.
    """
    if training_days >= 7:
        base = [
            ("easy_run", "interval", "strength_a", "tempo_run", "strength_b", "long_run", "recovery_run"),
        ][0]
        raw = list(enumerate(base))
    elif training_days >= 6:
        raw = [
            (0, "easy_run"), (1, "interval"), (2, "strength_a"),
            (3, "tempo_run"), (4, "strength_b"), (5, "long_run"),
        ]
    elif training_days >= 5:
        raw = [
            (0, "easy_run"), (1, "interval"), (2, "strength_a"),
            (3, "tempo_run"), (4, "long_run"),
        ]
    elif training_days >= 4:
        raw = [
            (0, "easy_run"), (1, "interval"), (2, "tempo_run"), (3, "long_run"),
        ]
    else:
        raw = [
            (0, "easy_run"), (1, "interval"), (2, "long_run"),
        ]

    # Adjust offsets relative to start_day
    all_days = [((offset - start_day) % 7, wtype) for offset, wtype in raw]

    # Place strength sessions by replacing easy_run slots (never replace long_run or interval)
    if strength_sessions > 0:
        strength_placed = 0
        strength_names = ["strength_a", "strength_b", "strength_c"]
        for i, (day_off, wtype) in enumerate(all_days):
            if strength_placed >= strength_sessions:
                break
            if wtype == "easy_run":
                all_days[i] = (day_off, strength_names[strength_placed])
                strength_placed += 1

    return all_days


def _create_workout_for_day(db, plan, workout_date, workout_type, week_num,
                             progress, is_taper, target_long, target_easy):
    """Create a single workout entry."""

    progress_multiplier = 0.7 + (progress * 0.3)
    if is_taper:
        progress_multiplier = 0.6

    if workout_type == "rest_day":
        return models.Workout(
            title="Rest Day",
            workout_type="rest_day",
            date=workout_date,
            estimated_duration=0,
            plan_id=plan.id,
        )

    if workout_type.startswith("strength"):
        duration = 45 if not is_taper else 30
        return models.Workout(
            title=f"Strength Session - {workout_type.replace('_', ' ').title()}",
            workout_type=workout_type,
            date=workout_date,
            estimated_duration=duration,
            plan_id=plan.id,
        )

    distance = None
    pace = None
    duration = None
    title = ""

    if workout_type == "easy_run":
        dist = round(target_easy * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 6)
        pace = "6:00"
        title = f"Easy Run - {dist} km"

    elif workout_type == "tempo_run":
        dist = round(target_easy * 0.8 * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 5)
        pace = "5:00"
        title = f"Tempo Run - {dist} km"

    elif workout_type == "interval":
        dist = round(target_easy * 0.7 * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 4.5)
        pace = "4:30"
        title = f"Intervals - {dist} km"

    elif workout_type == "long_run":
        dist = round(target_long * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 6.5)
        pace = "6:30"
        title = f"Long Run - {dist} km"

    elif workout_type == "hill_repeats":
        dist = round(target_easy * 0.7 * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 5.5)
        pace = "5:30"
        title = f"Hill Repeats - {dist} km"

    elif workout_type == "recovery_run":
        dist = round(target_easy * 0.6 * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 7)
        pace = "7:00"
        title = f"Recovery Run - {dist} km"

    elif workout_type == "progression_run":
        dist = round(target_easy * 0.9 * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 5.5)
        pace = "5:30"
        title = f"Progression Run - {dist} km"

    else:
        dist = round(target_easy * progress_multiplier, 1)
        distance = dist
        duration = int(dist * 6)
        pace = "6:00"
        title = f"Run - {dist} km"

    workout = models.Workout(
        title=title,
        workout_type=workout_type,
        date=workout_date,
        estimated_duration=duration,
    )

    workout.plan_id = plan.id

    workout.run_details = models.RunDetail(
        distance=distance,
        target_pace=pace,
        duration=duration,
    )

    return workout
