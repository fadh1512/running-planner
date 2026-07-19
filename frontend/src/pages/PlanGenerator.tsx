import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { GOAL_LABELS } from '../types';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PlanGenerator() {
  const [form, setForm] = useState({
    goal: 'half_marathon',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    current_weekly_km: '',
    fitness_level: 'intermediate',
    training_days: '5',
    strength_sessions: '2',
    start_day: '0',
  });
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [workoutCount, setWorkoutCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.end_date) { alert('Please set a race day'); return; }
    setGenerating(true);
    try {
      await api.createPlan({
        goal: form.goal, start_date: form.start_date, end_date: form.end_date,
        current_weekly_km: form.current_weekly_km ? parseFloat(form.current_weekly_km) : null,
        fitness_level: form.fitness_level,
        training_days: parseInt(form.training_days),
        strength_sessions: parseInt(form.strength_sessions),
        start_day: parseInt(form.start_day),
      });
      const weeks = Math.max(1, Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (7 * 86400000)));
      setWorkoutCount(weeks * parseInt(form.training_days));
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create plan';
      alert(message);
    }
    finally { setGenerating(false); }
  };

  if (success) {
    return (
      <div className="space-y-6 page-enter">
        <div className="card text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-5">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Training Plan Created!</h2>
          <p className="text-gray-500 mb-2">
            {workoutCount} workouts generated for your {GOAL_LABELS[form.goal]} plan
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {form.start_date} &rarr; {form.end_date} &middot; Starting on {DAY_LABELS[parseInt(form.start_day)]}s
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/calendar" className="btn-primary">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
              View Calendar
            </Link>
            <button onClick={() => setSuccess(false)} className="btn-secondary">Create Another Plan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="page-title">Training Plan Generator</h1>
        <p className="page-subtitle">Create a personalized plan based on your goals</p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Race Goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(GOAL_LABELS).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setForm({ ...form, goal: key })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${form.goal === key ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <span className="text-3xl block mb-1">{key === '5k' ? '🏃' : key === '10k' ? '🏃‍♂️' : key === 'half_marathon' ? '🏅' : '🏆'}</span>
                  <span className="text-sm font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="label">Race Day</label><input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required /></div>
          </div>

          <div>
            <label className="label">Current Weekly Mileage (km)</label>
            <input type="number" className="input" value={form.current_weekly_km} onChange={(e) => setForm({ ...form, current_weekly_km: e.target.value })} placeholder="e.g., 25" />
          </div>

          <div>
            <label className="label">Fitness Level</label>
            <div className="grid grid-cols-3 gap-3">
              {['beginner', 'intermediate', 'advanced'].map(level => (
                <button key={level} type="button" onClick={() => setForm({ ...form, fitness_level: level })}
                  className={`p-3 rounded-xl border-2 text-center capitalize font-semibold transition-all ${form.fitness_level === level ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  {level === 'beginner' ? '🌱' : level === 'intermediate' ? '💪' : '🏆'} {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Training Days/Week</label>
              <select className="input" value={form.training_days} onChange={(e) => setForm({ ...form, training_days: e.target.value })}>
                {[3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <div>
              <label className="label">Strength Sessions/Week</label>
              <select className="input" value={form.strength_sessions} onChange={(e) => setForm({ ...form, strength_sessions: e.target.value })}>
                {[0, 1, 2, 3, 4].map(s => <option key={s} value={s}>{s} sessions</option>)}
              </select>
            </div>
            <div>
              <label className="label">First Training Day</label>
              <select className="input" value={form.start_day} onChange={(e) => setForm({ ...form, start_day: e.target.value })}>
                {DAY_LABELS.map((day, i) => <option key={i} value={i}>{day}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={generating} className="btn-primary w-full py-3 text-base">
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : '🎯 Generate Training Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}
