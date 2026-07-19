export interface Workout {
  id: number;
  title: string;
  workout_type: string;
  date: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  estimated_duration: number | null;
  created_at: string;
  updated_at: string;
  run_details: RunDetail | null;
  strength_details: StrengthDetail[];
}

export interface RunDetail {
  id: number;
  workout_id: number;
  distance: number | null;
  target_pace: string | null;
  actual_pace: string | null;
  duration: number | null;
  elevation_gain: number | null;
  heart_rate_avg: number | null;
}

export interface StrengthDetail {
  id: number;
  workout_id: number;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  rest_time: number | null;
  notes: string | null;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  category: string;
  description: string | null;
  warmup: string | null;
  main_workout: string | null;
  cooldown: string | null;
  target_pace: string | null;
  estimated_duration: number | null;
  created_at: string;
}

export interface StrengthTemplateExercise {
  id: number;
  template_id: number;
  exercise_name: string;
  default_sets: number | null;
  default_reps: number | null;
  default_weight: number | null;
  notes: string | null;
}

export interface StrengthTemplate {
  id: number;
  name: string;
  template_type: string;
  description: string | null;
  created_at: string;
  exercises: StrengthTemplateExercise[];
}

export interface TrainingPlan {
  id: number;
  goal: string;
  start_date: string;
  end_date: string;
  current_weekly_km: number | null;
  fitness_level: string | null;
  training_days: number | null;
  strength_sessions: number | null;
  active: boolean;
  created_at: string;
}

export interface PersonalRecord {
  id: number;
  category: string;
  value: number;
  unit: string | null;
  achieved_at: string | null;
  created_at: string;
}

export interface RecoveryLog {
  id: number;
  date: string;
  sleep_hours: number | null;
  energy_level: number | null;
  muscle_soreness: number | null;
  stress_level: number | null;
  recovery_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  today_workout: Workout | null;
  weekly_distance: number;
  weekly_strength_sessions: number;
  weekly_completed: number;
  weekly_total: number;
  training_streak: number;
  recent_prs: PersonalRecord[];
  upcoming_workout: Workout | null;
}

export interface RunningStats {
  total_distance: number;
  total_runs: number;
  total_running_time: number;
  average_pace: string | null;
  longest_run: number | null;
  best_weekly_km: number | null;
  current_streak: number;
  longest_streak: number;
}

export interface StrengthStats {
  total_sessions: number;
  total_exercises: number;
  top_lifts: PersonalRecord[];
}

export const WORKOUT_TYPE_LABELS: Record<string, string> = {
  easy_run: 'Easy Run',
  tempo_run: 'Tempo Run',
  interval: 'Interval Session',
  hill_repeats: 'Hill Repeats',
  long_run: 'Long Run',
  progression_run: 'Progression Run',
  recovery_run: 'Recovery Run',
  strength_a: 'Strength A',
  strength_b: 'Strength B',
  strength_c: 'Strength C',
  rest_day: 'Rest Day',
  custom: 'Custom',
};

export const WORKOUT_TYPE_COLORS: Record<string, string> = {
  easy_run: '#22c55e',
  tempo_run: '#3b82f6',
  interval: '#ef4444',
  hill_repeats: '#f97316',
  long_run: '#8b5cf6',
  progression_run: '#06b6d4',
  recovery_run: '#84cc16',
  strength_a: '#f59e0b',
  strength_b: '#f97316',
  strength_c: '#eab308',
  rest_day: '#9ca3af',
  custom: '#6b7280',
};

export const GOAL_LABELS: Record<string, string> = {
  '5k': '5K',
  '10k': '10K',
  half_marathon: 'Half Marathon',
  marathon: 'Marathon',
};
