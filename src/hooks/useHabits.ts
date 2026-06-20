import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import type { Habit, HabitRecord, HabitType } from '../types'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayRecords, setTodayRecords] = useState<HabitRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [allHabits, records] = await Promise.all([api.getHabits(), api.getTodayRecords()])
      setHabits(allHabits); setTodayRecords(records)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const getMonthRecords = useCallback(async (year: number, month: number) => api.getMonthRecords(year, month), [])

  const addHabit = useCallback(async (name: string, type: HabitType) => {
    const created = await api.addHabit({ name, type })
    setHabits((prev) => [...prev, created])
  }, [])

  const toggleHabitStatus = useCallback(async (habitId: number) => {
    const result = await api.toggleHabit(habitId)
    setTodayRecords((prev) => result.toggled ? [...prev, result.record] : prev.filter((r: any) => r.habitId !== Number(habitId)))
  }, [])

  const deleteHabit = useCallback(async (id: number) => {
    await api.deleteHabit(id)
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }, [])

  return {
    habits,
    todayRecords,
    loading,
    addHabit,
    toggleHabitStatus,
    deleteHabit,
    getMonthRecords,
    refresh: loadAll,
  }
}
