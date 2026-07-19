import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats, Workout, WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(setStats).finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: number) => {
    await api.completeWorkout(id);
    api.getDashboardStats().then(setStats);
  };

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div className="text-center py-20 text-gray-500">Failed to load dashboard</div>;

  const completionRate = stats.weekly_total > 0
    ? Math.round((stats.weekly_completed / stats.weekly_total) * 100)
    : 0;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your training at a glance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Weekly Distance" value={`${stats.weekly_distance}`} unit="km" color="bg-blue-500" icon="🏃" />
        <StatCard label="Strength" value={`${stats.weekly_strength_sessions}`} unit="sessions" color="bg-orange-500" icon="💪" />
        <StatCard label="Streak" value={`${stats.training_streak}`} unit="days" color="bg-red-500" icon="🔥" />
        <StatCard label="Completion" value={`${completionRate}`} unit="%" color="bg-emerald-500" icon="✅" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Workout */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Today's Workout
          </h2>
          {stats.today_workout ? (
            <WorkoutCard workout={stats.today_workout} onComplete={() => handleComplete(stats.today_workout!.id)} />
          ) : (
            <EmptyState
              emoji="🎉"
              text="No workout scheduled today"
              link={{ to: '/calendar', label: 'Add to calendar' }}
            />
          )}
        </div>

        {/* Upcoming Workout */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Next Workout
          </h2>
          {stats.upcoming_workout ? (
            <WorkoutCard workout={stats.upcoming_workout} />
          ) : (
            <EmptyState emoji="📅" text="No upcoming workouts" />
          )}
        </div>
      </div>

      {/* Weekly Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Weekly Progress</h2>
          <span className="text-sm font-bold text-emerald-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {stats.weekly_completed} of {stats.weekly_total} workouts completed this week
        </p>
      </div>

      {/* Recent PRs */}
      {stats.recent_prs.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-yellow-500">🏆</span> Recent Personal Records
          </h2>
          <div className="space-y-2">
            {stats.recent_prs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {pr.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-500">{pr.achieved_at}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {pr.value} {pr.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, color, icon }: { label: string; value: string; unit: string; color: string; icon: string }) {
  return (
    <div className="card group cursor-default">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {value}<span className="text-base font-medium text-gray-500 ml-1">{unit}</span>
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{label}</p>
        </div>
        <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function WorkoutCard({ workout, onComplete }: { workout: Workout; onComplete?: () => void }) {
  const color = WORKOUT_TYPE_COLORS[workout.workout_type] || '#6b7280';
  const label = WORKOUT_TYPE_LABELS[workout.workout_type] || workout.workout_type;

  return (
    <div className="relative rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{workout.title}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{label} &middot; {workout.date}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {workout.run_details?.distance && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                📏 {workout.run_details.distance} km
              </span>
            )}
            {workout.estimated_duration && (
              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                ⏱ {workout.estimated_duration} min
              </span>
            )}
          </div>
          {workout.notes && (
            <p className="text-xs text-gray-400 mt-2 italic line-clamp-2">"{workout.notes}"</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {workout.completed ? (
            <span className="inline-flex items-center gap-1 badge bg-emerald-100 text-emerald-700">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              Done
            </span>
          ) : (
            onComplete && (
              <button onClick={onComplete} className="btn-primary btn-sm whitespace-nowrap">
                Complete
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ emoji, text, link }: { emoji: string; text: string; link?: { to: string; label: string } }) {
  return (
    <div className="text-center py-8">
      <p className="text-4xl mb-3">{emoji}</p>
      <p className="text-sm text-gray-500 font-medium">{text}</p>
      {link && (
        <Link to={link.to} className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold mt-2 inline-block hover:underline">
          {link.label} &rarr;
        </Link>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}
