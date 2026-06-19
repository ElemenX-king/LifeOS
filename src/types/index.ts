export type Priority = 'low' | 'medium' | 'high'

export interface Todo {
  id?: number
  title: string
  completed: boolean
  priority: Priority
  category: string
  date: string
  dueDate?: string
  isImportant?: boolean
  createdAt: number
  updatedAt: number
}

// ========== 习惯打卡 ==========
export type HabitType = 'positive' | 'negative'

export interface Habit {
  id?: number
  name: string
  type: HabitType
  createdAt: number
}

export interface HabitRecord {
  id?: number
  habitId: number
  date: string // YYYY-MM-DD
  status: 'completed' | 'failed'
}

// ========== 项目管理 ==========
export interface Project {
  id?: number
  name: string
  parentId?: number
  startDate: string
  endDate: string
  progress: number
  type: 'school' | 'company' | 'personal'
  target?: number
  completionNote?: string
  isArchived?: boolean
}

// ========== 执行条目 ==========
export interface ExecutionEntry {
  id?: number
  subProjectId: number
  parentId: number
  name: string
  target: number
  date: string
  notes: string
}
