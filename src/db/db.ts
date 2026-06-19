import Dexie, { type Table } from 'dexie'
import type { Todo, Habit, HabitRecord, Project, ExecutionEntry } from '../types'

class LifeOSDatabase extends Dexie {
  todos!: Table<Todo, number>
  habits!: Table<Habit, number>
  habitRecords!: Table<HabitRecord, number>
  projects!: Table<Project, number>
  executions!: Table<ExecutionEntry, number>

  constructor() {
    super('LifeOS')
    this.version(1).stores({
      todos: '++id, date, category, completed, priority',
    })
    this.version(2).stores({
      todos: '++id, date, category, completed, priority, dueDate',
    })
    this.version(3).stores({
      todos: '++id, date, category, completed, priority, dueDate',
      habits: '++id',
      habitRecords: '++id, habitId, date, [habitId+date]',
    })
    this.version(4).stores({
      todos: '++id, date, category, completed, priority, dueDate, isImportant',
      habits: '++id',
      habitRecords: '++id, habitId, date, [habitId+date]',
    })
    this.version(5).stores({
      todos: '++id, date, category, completed, priority, dueDate, isImportant',
      habits: '++id',
      habitRecords: '++id, habitId, date, [habitId+date]',
      projects: '++id, parentId',
    })
    this.version(7).stores({
      todos: '++id, date, category, completed, priority, dueDate, isImportant',
      habits: '++id',
      habitRecords: '++id, habitId, date, [habitId+date]',
      projects: '++id, parentId',
      daily_notes: 'date',
      executions: '++id, subProjectId, parentId, date',
    })
  }
}

export const db = new LifeOSDatabase()
