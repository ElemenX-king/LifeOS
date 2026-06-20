async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export const api = {
  getTodos: () => request<any[]>('/api/todos'),
  getImportantTodos: () => request<any[]>('/api/todos/important'),
  addTodo: (data: any) => request<any>('/api/todos', { method: 'POST', body: JSON.stringify(data) }),
  updateTodo: (id: number, data: any) => request<any>(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleTodo: (id: number) => request<any>(`/api/todos/${id}/toggle`, { method: 'PATCH' }),
  deleteTodo: (id: number) => request<any>(`/api/todos/${id}`, { method: 'DELETE' }),

  getProjects: () => request<any[]>('/api/projects'),
  addProject: (data: any) => request<any>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: any) => request<any>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<any>(`/api/projects/${id}`, { method: 'DELETE' }),
  archiveProject: (id: number) => request<any>(`/api/projects/${id}/archive`, { method: 'PATCH' }),

  getExecutions: () => request<any[]>('/api/executions'),
  addExecution: (data: any) => request<any>('/api/executions', { method: 'POST', body: JSON.stringify(data) }),
  deleteExecution: (id: number) => request<any>(`/api/executions/${id}`, { method: 'DELETE' }),

  getHabits: () => request<any[]>('/api/habits'),
  addHabit: (data: any) => request<any>('/api/habits', { method: 'POST', body: JSON.stringify(data) }),
  deleteHabit: (id: number) => request<any>(`/api/habits/${id}`, { method: 'DELETE' }),

  getMonthRecords: (year: number, month: number) => request<any[]>(`/api/habit-records?year=${year}&month=${month}`),
  getTodayRecords: () => request<any[]>('/api/habit-records/today'),
  toggleHabit: (habitId: number) => request<any>(`/api/habit-records/${habitId}/toggle`, { method: 'PATCH' }),

  getJournal: (date: string) => request<{ content: string }>(`/api/journal/${date}`),
  saveJournal: (date: string, content: string) => request<any>(`/api/journal/${date}`, { method: 'PUT', body: JSON.stringify({ content }) }),
}
