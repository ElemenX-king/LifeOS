import { useState, useEffect, useCallback } from 'react'
import { db } from '../db/db'
import type { Todo, Priority } from '../types'

// [改动] 获取今日日期字符串
function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

// [改动] 种子数据：3 条今日任务 + 3 条逾期任务
const SEED_DATA: Omit<Todo, 'id'>[] = [
  { title: '完成 Q2 产品报告', completed: false, priority: 'high', category: 'work', date: getTodayStr(), dueDate: getTodayStr(), createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() },
  { title: '周会 PPT 准备', completed: false, priority: 'medium', category: 'work', date: getTodayStr(), createdAt: Date.now() - 86400000, updatedAt: Date.now() },
  { title: '回复客户邮件', completed: true, priority: 'low', category: 'work', date: getTodayStr(), createdAt: Date.now(), updatedAt: Date.now() },
  { title: '提交报销申请', completed: false, priority: 'high', category: 'finance', date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10), createdAt: Date.now() - 86400000 * 4, updatedAt: Date.now() - 86400000 * 3 },
  { title: '更新项目 README', completed: false, priority: 'medium', category: 'work', date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10), createdAt: Date.now() - 86400000 * 6, updatedAt: Date.now() - 86400000 * 5 },
  { title: '整理学习笔记', completed: false, priority: 'low', category: 'study', date: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10), createdAt: Date.now() - 86400000 * 8, updatedAt: Date.now() - 86400000 * 7 },
]

// [修复] 种子注入：仅在数据库为空时插入一次
let seeded = false

async function seedIfEmpty() {
  if (seeded) return
  seeded = true
  const count = await db.todos.count()
  if (count === 0) {
    await db.todos.bulkAdd(SEED_DATA as Todo[])
  }
}

// [改动] 不再接收 date 参数，固定查询「今日 + 过往逾期」
export function useTodos() {
  const todayStr = getTodayStr()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

  const filterAndSort = (list: Todo[]) => {
    const filtered = list.filter(
      (t) => !t.isImportant && (t.date === todayStr || (t.date < todayStr && !t.completed)),
    )
    filtered.sort((a, b) => {
      // 第一优先级：优先级从高到低
      const pa = priorityOrder[a.priority] ?? 99
      const pb = priorityOrder[b.priority] ?? 99
      if (pa !== pb) return pa - pb
      // 第二优先级：时间从早到晚
      return a.date.localeCompare(b.date)
    })
    return filtered
  }

  const loadTodos = useCallback(async () => {
    setLoading(true)
    const all = await db.todos
      .where('date')
      .belowOrEqual(todayStr)
      .toArray()
    setTodos(filterAndSort(all))
    setLoading(false)
  }, [todayStr])

  useEffect(() => {
    seedIfEmpty().then(() => loadTodos())
  }, [loadTodos])

  // 乐观更新：addTodo
  const addTodo = useCallback(
    async (title: string, priority: Priority = 'medium', date?: string) => {
      const now = Date.now()
      const targetDate = date || todayStr
      const id = await db.todos.add({
        title,
        completed: false,
        priority,
        category: 'other',
        date: targetDate,
        createdAt: now,
        updatedAt: now,
      })
      // 直接插入本地状态
      setTodos((prev) =>
        filterAndSort([...prev, { id, title, completed: false, priority, category: 'other', date: targetDate, createdAt: now, updatedAt: now }]),
      )
    },
    [todayStr],
  )

  // 乐观更新：toggleTodo
  const toggleTodo = useCallback(
    async (id: number) => {
      const todo = todos.find((t) => t.id === id)
      if (!todo) return
      const newCompleted = !todo.completed
      await db.todos.update(id, { completed: newCompleted, updatedAt: Date.now() })
      // 直接更新本地状态
      setTodos((prev) =>
        filterAndSort(prev.map((t) => (t.id === id ? { ...t, completed: newCompleted, updatedAt: Date.now() } : t))),
      )
    },
    [todos],
  )

  // 乐观更新：updateTodo
  const updateTodo = useCallback(
    async (id: number, updates: Partial<Todo>) => {
      await db.todos.update(id, { ...updates, updatedAt: Date.now() })
      setTodos((prev) =>
        filterAndSort(prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t))),
      )
    },
    [],
  )

  // 乐观更新：deleteTodo
  const deleteTodo = useCallback(
    async (id: number) => {
      await db.todos.delete(id)
      setTodos((prev) => filterAndSort(prev.filter((t) => t.id !== id)))
    },
    [],
  )

  // ========== 重要日程 ==========
  const [importantTodos, setImportantTodos] = useState<Todo[]>([])
  const [importantLoading, setImportantLoading] = useState(true)

  const loadImportantTodos = useCallback(async () => {
    setImportantLoading(true)
    const all = await db.todos
      .where('isImportant')
      .equals(1)
      .filter((t) => t.date >= todayStr)
      .toArray()
    all.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    setImportantTodos(all)
    setImportantLoading(false)
  }, [todayStr])

  useEffect(() => {
    loadImportantTodos()
  }, [loadImportantTodos])

  const addImportantTodo = useCallback(
    async (title: string, dueDate: string) => {
      const now = Date.now()
      const id = await db.todos.add({
        title, completed: false, priority: 'medium' as Priority, category: 'other',
        date: dueDate, dueDate, isImportant: true,
        createdAt: now, updatedAt: now,
      })
      setImportantTodos((prev) => {
        const next = [...prev, { id, title, completed: false, priority: 'medium' as Priority, category: 'other', date: dueDate, dueDate, isImportant: true, createdAt: now, updatedAt: now }]
        next.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
        return next
      })
      return id
    },
    [],
  )

  const toggleImportantTodo = useCallback(
    async (id: number) => {
      const todo = importantTodos.find((t) => t.id === id)
      if (!todo) return
      const newCompleted = !todo.completed
      await db.todos.update(id, { completed: newCompleted, updatedAt: Date.now() })
      setImportantTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)),
      )
    },
    [importantTodos],
  )

  const deleteImportantTodo = useCallback(
    async (id: number) => {
      await db.todos.delete(id)
      setImportantTodos((prev) => prev.filter((t) => t.id !== id))
    },
    [],
  )

  return {
    todos,
    loading,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    refresh: loadTodos,
    importantTodos,
    importantLoading,
    addImportantTodo,
    toggleImportantTodo,
    deleteImportantTodo,
    refreshImportant: loadImportantTodos,
  }
}
