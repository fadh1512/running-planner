import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { WorkoutTemplate, StrengthTemplate, WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../types';

export default function Templates() {
  const [runningTemplates, setRunningTemplates] = useState<WorkoutTemplate[]>([]);
  const [strengthTemplates, setStrengthTemplates] = useState<StrengthTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'running' | 'strength'>('running');

  const load = () => {
    api.getRunningTemplates().then(setRunningTemplates);
    api.getStrengthTemplates().then(setStrengthTemplates);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div>
        <h1 className="page-title">Workout Templates</h1>
        <p className="page-subtitle">Pre-built workouts for quick planning</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('running')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'running' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
          🏃 Running
        </button>
        <button onClick={() => setActiveTab('strength')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'strength' ? 'bg-white shadow-sm text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}>
          💪 Strength
        </button>
      </div>

      {activeTab === 'running' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {runningTemplates.map((t) => (
            <div key={t.id} className="card group" style={{ borderLeftColor: WORKOUT_TYPE_COLORS[t.category], borderLeftWidth: 4 }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{t.name}</h3>
                <button onClick={() => { if (confirm('Delete?')) { api.deleteRunningTemplate(t.id).then(load); } }} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">✕</button>
              </div>
              <p className="text-sm text-gray-600 mb-3">{t.description}</p>
              {t.warmup && <TemplateSection label="Warm-up" text={t.warmup} />}
              {t.main_workout && <TemplateSection label="Main" text={t.main_workout} />}
              {t.cooldown && <TemplateSection label="Cool-down" text={t.cooldown} />}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 font-medium">
                {t.estimated_duration && <span className="bg-gray-100 px-2 py-1 rounded-full">⏱ {t.estimated_duration} min</span>}
                {t.target_pace && <span className="bg-gray-100 px-2 py-1 rounded-full">🎯 {t.target_pace}/km</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'strength' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strengthTemplates.map((t) => (
            <div key={t.id} className="card group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                  <span className="badge bg-orange-100 text-orange-700 mt-1">Template {t.template_type}</span>
                </div>
                <button onClick={() => { if (confirm('Delete?')) { api.deleteStrengthTemplate(t.id).then(load); } }} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">✕</button>
              </div>
              <p className="text-sm text-gray-600 mb-3">{t.description}</p>
              <div className="space-y-1">
                {t.exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium text-gray-800">{ex.exercise_name}</span>
                    <span className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded">
                      {ex.default_sets}×{ex.default_reps}{ex.default_weight ? ` @ ${ex.default_weight}kg` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-1.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}
