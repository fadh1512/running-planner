import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Workout, PersonalRecord, WORKOUT_TYPE_LABELS } from '../types';

export default function Progress() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getWorkouts(), api.getRecords()])
      .then(([w, r]) => { setWorkouts(w); setRecords(r); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  const completedRuns = workouts.filter(w => w.completed && w.run_details?.distance);
  const totalDistance = completedRuns.reduce((sum, w) => sum + (w.run_details?.distance || 0), 0);
  const completedStrength = workouts.filter(w => w.completed && w.workout_type.startsWith('strength'));

  const weeklyData: Record<string, number> = {};
  completedRuns.forEach(w => {
    const d = new Date(w.date + 'T00:00:00');
    const target = new Date(d);
    target.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(target.getFullYear(), 0, 4);
    const weekNum = 1 + Math.ceil(((target.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    const key = `${target.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    weeklyData[key] = (weeklyData[key] || 0) + (w.run_details?.distance || 0);
  });
  const weeklyEntries = Object.entries(weeklyData).slice(-12).map(([week, distance]) => ({ week, distance: Math.round(distance * 10) / 10 }));
  const maxDistance = Math.max(...weeklyEntries.map(e => e.distance), 1);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="page-title">Progress Tracking</h1>
        <p className="page-subtitle">Monitor your improvement over time</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard value={`${Math.round(totalDistance * 10) / 10}`} label="Total km" color="text-blue-600 bg-blue-50" />
        <SummaryCard value={completedRuns.length.toString()} label="Runs Done" color="text-indigo-600 bg-indigo-50" />
        <SummaryCard value={completedStrength.length.toString()} label="Strength" color="text-orange-600 bg-orange-50" />
        <SummaryCard value={records.length.toString()} label="PRs" color="text-purple-600 bg-purple-50" />
      </div>

      <div className="card">
        <h2 className="text-base font-semibold mb-4">Weekly Running Distance</h2>
        {weeklyEntries.length > 0 ? (
          <div className="space-y-2">
            {weeklyEntries.map(entry => (
              <div key={entry.week} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14 font-mono shrink-0">{entry.week.split('-')[1]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-7 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ width: `${Math.max(10, (entry.distance / maxDistance) * 100)}%` }}>
                    <span className="text-xs font-bold text-white drop-shadow-sm">{entry.distance} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8 text-sm">No running data yet. Complete some runs!</p>
        )}
      </div>

      <div className="card">
        <h2 className="text-base font-semibold mb-4">Recent Workouts</h2>
        <div className="space-y-1">
          {workouts.slice(0, 10).map(w => (
            <div key={w.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${w.completed ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{w.title}</p>
                  <p className="text-xs text-gray-500">{WORKOUT_TYPE_LABELS[w.workout_type] || w.workout_type} &middot; {w.date}</p>
                </div>
              </div>
              <div className="text-right text-sm shrink-0 ml-3">
                {w.run_details?.distance && <span className="text-blue-600 font-bold">{w.run_details.distance} km</span>}
                {w.run_details?.actual_pace && <span className="text-gray-500 ml-1 text-xs">{w.run_details.actual_pace}/km</span>}
              </div>
            </div>
          ))}
          {workouts.length === 0 && <p className="text-gray-400 text-center py-8 text-sm">No workouts yet</p>}
        </div>
      </div>

      {records.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <span className="text-yellow-500">🏆</span> Personal Records
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {records.map(pr => (
              <div key={pr.id} className="flex items-center justify-between p-3.5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-800">{pr.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{pr.achieved_at}</p>
                </div>
                <span className="text-lg font-bold text-indigo-600">{pr.value} <span className="text-sm font-medium">{pr.unit || ''}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className={`card text-center ${color.split(' ')[1]}`}>
      <p className={`text-2xl sm:text-3xl font-bold ${color.split(' ')[0]}`}>{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
    </div>
  );
}
