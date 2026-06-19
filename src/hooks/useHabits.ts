import { useState, useEffect, useCallback } from 'react'
import { db } from '../db/db'
import type { Habit, HabitRecord, HabitType } from '../types'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function useHabits() {
  const todayStr = getTodayStr()
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayRecords, setTodayRecords] = useState<HabitRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [allHabits, records] = await Promise.all([
      db.habits.toArray(),
      db.habitRecords.where('date').equals(todayStr).toArray(),
    ])
    setHabits(allHabits)
    setTodayRecords(records)
    setLoading(false)
  }, [todayStr])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 获取指定月份的打卡记录
  const getMonthRecords = useCallback(
    async (year: number, month: number) => {
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const end = `${year}-${String(month + 1).padStart(2, '0')}-31`
      return db.habitRecords.where('date').between(start, end, true, true).toArray()
    },
    [],
  )

  // 新建习惯
  const addHabit = useCallback(
    async (name: string, type: HabitType) => {
      const now = Date.now()
      const id = await db.habits.add({ name, type, createdAt: now })
      setHabits((prev) => [...prev, { id, name, type, createdAt: now }])
      return id
    },
    [],
  )

  // 切换今日打卡状态
  const toggleHabitStatus = useCallback(
    async (habitId: number) => {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) return

      const existing = await db.habitRecords
        .where('[habitId+date]')
        .equals([habitId, todayStr])
        .first()

      if (existing) {
        // 已打卡 → 取消
        await db.habitRecords.delete(existing.id!)
        setTodayRecords((prev) => prev.filter((r) => r.id !== existing.id))
      } else {
        // 未打卡 → 添加
        const status = habit.type === 'positive' ? 'completed' : 'failed'
        const id = await db.habitRecords.add({ habitId, date: todayStr, status })
        setTodayRecords((prev) => [...prev, { id, habitId, date: todayStr, status }])
      }
    },
    [habits, todayStr],
  )

  // 删除习惯
  const deleteHabit = useCallback(
    async (id: number) => {
      await db.habits.delete(id)
      await db.habitRecords.where('habitId').equals(id).delete()
      setHabits((prev) => prev.filter((h) => h.id !== id))
      setTodayRecords((prev) => prev.filter((r) => r.habitId !== id))
    },
    [],
  )

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
