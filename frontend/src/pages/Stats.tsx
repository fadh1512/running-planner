import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RunningStats, StrengthStats } from '../types';

export default function Stats() {
  const [running, setRunning] = useState<RunningStats | null>(null);
  const [strength, setStrength] = useState<StrengthStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRunningStats(), api.getStrengthStats()])
      .then(([r, s]) => { setRunning(r); setStrength(s); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="page-title">Statistics</h1>
        <p className="page-subtitle">Your overall training numbers</p>
      </div>

      {running && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">🏃 Running</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox label="Total Distance" value={`${running.total_distance}`} unit="km" color="blue" />
            <StatBox label="Total Runs" value={`${running.total_runs}`} unit="runs" color="indigo" />
            <StatBox label="Total Time" value={`${Math.floor(running.total_running_time / 60)}h ${running.total_running_time % 60}m`} unit="" color="purple" />
            <StatBox label="Longest Run" value={running.longest_run ? `${running.longest_run}` : '—'} unit={running.longest_run ? 'km' : ''} color="orange" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox label="Current Streak" value={`${running.current_streak}`} unit="days" color="red" />
            <StatBox label="Best Streak" value={`${running.longest_streak}`} unit="days" color="yellow" />
            <StatBox label="Avg Pace" value={running.average_pace || '—'} unit={running.average_pace ? '/km' : ''} color="teal" />
            <StatBox label="Best Weekly" value={running.best_weekly_km ? `${running.best_weekly_km}` : '—'} unit={running.best_weekly_km ? 'km' : ''} color="indigo" />
          </div>
        </div>
      )}

      {strength && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">💪 Strength</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatBox label="Total Sessions" value={`${strength.total_sessions}`} unit="sessions" color="orange" />
            <StatBox label="Total Exercises" value={`${strength.total_exercises}`} unit="reps logged" color="red" />
          </div>

          {strength.top_lifts.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-3">🏆 Personal Bests</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {strength.top_lifts.map(pr => (
                  <div key={pr.id} className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {pr.category.replace('best_', '').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-2xl font-bold text-indigo-600">{pr.value} <span className="text-sm">{pr.unit || ''}</span></p>
                    <p className="text-xs text-gray-400 mt-1">{pr.achieved_at}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50', emerald: 'text-indigo-600 bg-indigo-50',
    purple: 'text-purple-600 bg-purple-50', orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50', yellow: 'text-yellow-600 bg-yellow-50',
    teal: 'text-teal-600 bg-teal-50', indigo: 'text-indigo-600 bg-indigo-50',
  };
  const c = colorMap[color] || 'text-gray-600 bg-gray-50';
  return (
    <div className={`card text-center ${c.split(' ')[1]}`}>
      <p className={`text-xl sm:text-2xl font-bold ${c.split(' ')[0]}`}>{value}<span className="text-sm font-medium ml-0.5">{unit}</span></p>
      <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
    </div>
  );
}
