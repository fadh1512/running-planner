import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RecoveryLog } from '../types';

export default function Recovery() {
  const [logs, setLogs] = useState<RecoveryLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => { api.getRecoveryLogs().then(setLogs).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Recovery Tracker</h1>
          <p className="page-subtitle">Log your daily recovery status</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Log
        </button>
      </div>

      {showForm && <RecoveryForm onClose={() => setShowForm(false)} onSaved={() => { load(); setShowForm(false); }} />}

      {logs.length > 0 && (
        <div className="card text-center">
          <h2 className="text-base font-semibold mb-3">Today's Recovery Score</h2>
          <RecoveryScoreDisplay score={logs[0].recovery_score} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <MiniStat label="Sleep" value={logs[0].sleep_hours ? `${logs[0].sleep_hours}h` : '—'} icon="😴" />
            <MiniStat label="Energy" value={logs[0].energy_level ? `${logs[0].energy_level}/10` : '—'} icon="⚡" />
            <MiniStat label="Soreness" value={logs[0].muscle_soreness ? `${logs[0].muscle_soreness}/10` : '—'} icon="🦵" />
            <MiniStat label="Stress" value={logs[0].stress_level ? `${logs[0].stress_level}/10` : '—'} icon="🧠" />
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-base font-semibold mb-4">Recovery History</h2>
        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.slice(0, 30).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-medium text-gray-700 w-24">{log.date}</span>
                  <ScoreBadge score={log.recovery_score} />
                </div>
                <div className="hidden sm:flex gap-4 text-xs text-gray-500 font-medium">
                  <span>Sleep: {log.sleep_hours || '—'}</span>
                  <span>Energy: {log.energy_level || '—'}</span>
                  <span>Soreness: {log.muscle_soreness || '—'}</span>
                  <span>Stress: {log.stress_level || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">💚</p>
            <p className="text-sm text-gray-500 font-medium">No recovery logs yet. Start tracking!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecoveryScoreDisplay({ score }: { score: number | null }) {
  if (score === null) return <p className="text-gray-400">No data</p>;
  const color = score >= 70 ? 'from-indigo-500 to-indigo-400' : score >= 40 ? 'from-yellow-500 to-yellow-400' : 'from-red-500 to-red-400';
  const textColor = score >= 70 ? 'text-indigo-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';
  const label = score >= 70 ? 'Ready for hard training' : score >= 40 ? 'Consider easy training or rest' : 'Rest day recommended';

  return (
    <div>
      <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${color} shadow-lg`}>
        <span className="text-3xl font-bold text-white drop-shadow-sm">{Math.round(score)}%</span>
      </div>
      <p className={`text-sm font-semibold mt-3 ${textColor}`}>{label}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-sm">—</span>;
  const c = score >= 70 ? 'text-indigo-700 bg-indigo-100' : score >= 40 ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c}`}>{Math.round(score)}%</span>;
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-lg mb-0.5">{icon}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
}

function RecoveryForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ date: today, sleep_hours: '', energy_level: '5', muscle_soreness: '5', stress_level: '5', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.logRecovery({
        date: form.date, sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
        energy_level: parseInt(form.energy_level), muscle_soreness: parseInt(form.muscle_soreness),
        stress_level: parseInt(form.stress_level), notes: form.notes || null,
      });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Log Recovery</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className="label">Hours of Sleep</label><input type="number" step="0.5" className="input" value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} placeholder="7.5" /></div>
            <SliderField label="Energy Level" icon="⚡" value={form.energy_level} onChange={(v) => setForm({ ...form, energy_level: v })} />
            <SliderField label="Muscle Soreness" icon="🦵" value={form.muscle_soreness} onChange={(v) => setForm({ ...form, muscle_soreness: v })} />
            <SliderField label="Stress Level" icon="🧠" value={form.stress_level} onChange={(v) => setForm({ ...form, stress_level: v })} />
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, icon, value, onChange }: { label: string; icon: string; value: string; onChange: (v: string) => void }) {
  const numVal = parseInt(value);
  const color = numVal >= 7 ? 'text-indigo-600' : numVal >= 4 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div>
      <label className="label flex items-center justify-between">
        <span>{icon} {label}</span>
        <span className={`font-bold ${color}`}>{value}/10</span>
      </label>
      <input type="range" min="1" max="10" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium"><span>1 - Low</span><span>10 - High</span></div>
    </div>
  );
}
