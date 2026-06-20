import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import type { Todo, Priority } from '../types'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

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
    try { const all = await api.getTodos(); setTodos(filterAndSort(all)) }
    catch (e) { console.error(e) }
    setLoading(false)
  }, [todayStr])

  useEffect(() => { loadTodos() }, [loadTodos])

  const addTodo = useCallback(async (title: string, priority: Priority = 'medium', date?: string) => {
    const created = await api.addTodo({ title, priority, date: date || todayStr })
    setTodos((prev) => filterAndSort([...prev, created]))
  }, [todayStr])

  const toggleTodo = useCallback(async (id: number) => {
    const updated = await api.toggleTodo(id)
    setTodos((prev) => filterAndSort(prev.map((t) => (t.id === id ? updated : t))))
  }, [])

  const updateTodo = useCallback(async (id: number, updates: Partial<Todo>) => {
    const updated = await api.updateTodo(id, updates)
    setTodos((prev) => filterAndSort(prev.map((t) => (t.id === id ? updated : t))))
  }, [])

  const deleteTodo = useCallback(async (id: number) => {
    await api.deleteTodo(id)
    setTodos((prev) => filterAndSort(prev.filter((t) => t.id !== id)))
  }, [])

  // ========== 重要日程 ==========
  const [importantTodos, setImportantTodos] = useState<Todo[]>([])
  const [importantLoading, setImportantLoading] = useState(true)

  const loadImportantTodos = useCallback(async () => {
    setImportantLoading(true)
    try {
      const all = await api.getImportantTodos()
      const filtered = all.filter((t: Todo) => t.date >= todayStr)
      filtered.sort((a: Todo, b: Todo) => a.date.localeCompare(b.date))
      setImportantTodos(filtered)
    } catch (e) { console.error(e) }
    setImportantLoading(false)
  }, [todayStr])

  useEffect(() => {
    loadImportantTodos()
  }, [loadImportantTodos])

  const addImportantTodo = useCallback(async (title: string, dueDate: string) => {
    const created = await api.addTodo({ title, date: dueDate, dueDate, isImportant: true })
    setImportantTodos((prev) => { const next = [...prev, created]; next.sort((a: Todo, b: Todo) => a.date.localeCompare(b.date)); return next })
  }, [])

  const toggleImportantTodo = useCallback(async (id: number) => {
    const updated = await api.toggleTodo(id)
    setImportantTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }, [])

  const deleteImportantTodo = useCallback(async (id: number) => {
    await api.deleteTodo(id)
    setImportantTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

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
