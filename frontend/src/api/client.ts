const BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Workouts
export const api = {
  getWorkouts: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    return request<any[]>(`/workouts/${qs ? `?${qs}` : ''}`);
  },

  getWorkout: (id: number) => request<any>(`/workouts/${id}`),

  createWorkout: (data: any) =>
    request<any>('/workouts/', { method: 'POST', body: JSON.stringify(data) }),

  updateWorkout: (id: number, data: any) =>
    request<any>(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  completeWorkout: (id: number) =>
    request<any>(`/workouts/${id}/complete`, { method: 'PATCH' }),

  deleteWorkout: (id: number) =>
    request<void>(`/workouts/${id}`, { method: 'DELETE' }),

  // Templates
  getRunningTemplates: (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return request<any[]>(`/templates/running${qs}`);
  },

  createRunningTemplate: (data: any) =>
    request<any>('/templates/running', { method: 'POST', body: JSON.stringify(data) }),

  deleteRunningTemplate: (id: number) =>
    request<void>(`/templates/running/${id}`, { method: 'DELETE' }),

  getStrengthTemplates: (type?: string) => {
    const qs = type ? `?template_type=${type}` : '';
    return request<any[]>(`/templates/strength${qs}`);
  },

  createStrengthTemplate: (data: any) =>
    request<any>('/templates/strength', { method: 'POST', body: JSON.stringify(data) }),

  deleteStrengthTemplate: (id: number) =>
    request<void>(`/templates/strength/${id}`, { method: 'DELETE' }),

  // Training Plans
  getPlans: () => request<any[]>('/plans/'),
  getActivePlan: () => request<any>('/plans/active'),
  createPlan: (data: any) =>
    request<any>('/plans/', { method: 'POST', body: JSON.stringify(data) }),

  // Recovery
  getRecoveryLogs: () => request<any[]>('/recovery/'),
  logRecovery: (data: any) =>
    request<any>('/recovery/', { method: 'POST', body: JSON.stringify(data) }),

  // Stats
  getDashboardStats: () => request<any>('/stats/dashboard'),
  getRunningStats: () => request<any>('/stats/running'),
  getStrengthStats: () => request<any>('/stats/strength'),

  // Personal Records
  getRecords: (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return request<any[]>(`/records/${qs}`);
  },
  createRecord: (data: any) =>
    request<any>('/records/', { method: 'POST', body: JSON.stringify(data) }),
};
