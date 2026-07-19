import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api } from '../api/client';
import { Workout, WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../types';

export default function Calendar() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const calendarRef = useRef<any>(null);

  const loadWorkouts = (fetchInfo?: any) => {
    const start = fetchInfo?.startStr?.split('T')[0];
    const end = fetchInfo?.endStr?.split('T')[0];
    api.getWorkouts(start, end).then(setWorkouts);
  };

  useEffect(() => { loadWorkouts(); }, []);

  const events = workouts.map((w) => ({
    id: w.id.toString(),
    title: w.title,
    date: w.date,
    backgroundColor: w.completed ? '#10b981' : WORKOUT_TYPE_COLORS[w.workout_type] || '#6b7280',
    borderColor: 'transparent',
    textColor: '#fff',
    extendedProps: { workout: w },
  }));

  const handleEventClick = (info: any) => {
    setSelectedWorkout(info.event.extendedProps.workout);
    setShowModal(true);
  };

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr.split('T')[0]);
    setSelectedWorkout(null);
    setShowModal(true);
  };

  const handleComplete = async (id: number) => {
    await api.completeWorkout(id);
    loadWorkouts();
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this workout?')) {
      await api.deleteWorkout(id);
      loadWorkouts();
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle hidden sm:block">Plan and track your workouts</p>
        </div>
        <button
          onClick={() => { setSelectedWorkout(null); setSelectedDate(new Date().toISOString().split('T')[0]); setShowModal(true); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          <span className="hidden sm:inline">Add Workout</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: WORKOUT_TYPE_COLORS[key] }} />
            <span className="text-gray-500 font-medium hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card-flat p-0 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={(info) => loadWorkouts({ startStr: info.startStr, endStr: info.endStr })}
          height="auto"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }}
          dayMaxEvents={2}
          eventDisplay="block"
        />
      </div>

      {showModal && (
        <WorkoutModal
          workout={selectedWorkout}
          date={selectedDate}
          onClose={() => setShowModal(false)}
          onSaved={() => { loadWorkouts(); setShowModal(false); }}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function WorkoutModal({ workout, date, onClose, onSaved, onComplete, onDelete }: {
  workout: Workout | null; date: string; onClose: () => void; onSaved: () => void;
  onComplete: (id: number) => void; onDelete: (id: number) => void;
}) {
  const [form, setForm] = useState({
    title: workout?.title || '',
    workout_type: workout?.workout_type || 'easy_run',
    date: workout?.date || date,
    notes: workout?.notes || '',
    estimated_duration: workout?.estimated_duration?.toString() || '',
    distance: workout?.run_details?.distance?.toString() || '',
    target_pace: workout?.run_details?.target_pace || '',
    actual_pace: workout?.run_details?.actual_pace || '',
  });
  const [saving, setSaving] = useState(false);

  const isRun = ['easy_run','tempo_run','interval','hill_repeats','long_run','progression_run','recovery_run'].includes(form.workout_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data: any = {
      title: form.title, workout_type: form.workout_type, date: form.date,
      notes: form.notes || null,
      estimated_duration: form.estimated_duration ? parseInt(form.estimated_duration) : null,
    };
    if (isRun) {
      data.run_details = {
        distance: form.distance ? parseFloat(form.distance) : null,
        target_pace: form.target_pace || null,
        actual_pace: form.actual_pace || null,
      };
    }
    try {
      workout ? await api.updateWorkout(workout.id, data) : await api.createWorkout(data);
      onSaved();
    } catch { alert('Failed to save workout'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">{workout ? 'Workout Details' : 'New Workout'}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Morning run..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.workout_type} onChange={(e) => setForm({ ...form, workout_type: e.target.value })}>
                  {Object.entries(WORKOUT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input type="number" className="input" value={form.estimated_duration} onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} placeholder="45" />
            </div>
            {isRun && (
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Distance (km)</label><input type="number" step="0.1" className="input" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} /></div>
                <div><label className="label">Target Pace</label><input className="input" value={form.target_pace} onChange={(e) => setForm({ ...form, target_pace: e.target.value })} placeholder="5:30" /></div>
                <div><label className="label">Actual Pace</label><input className="input" value={form.actual_pace} onChange={(e) => setForm({ ...form, actual_pace: e.target.value })} placeholder="5:25" /></div>
              </div>
            )}
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Felt strong today..." />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                {workout && !workout.completed && <button type="button" onClick={() => onComplete(workout.id)} className="btn-primary btn-sm">Complete</button>}
                {workout && <button type="button" onClick={() => onDelete(workout.id)} className="btn-danger btn-sm">Delete</button>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : workout ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
