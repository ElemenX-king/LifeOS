import { useState, useEffect } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../api'
import type { Todo } from '../types'

// ========== 获取某天的周日（week start） ==========
function getSundayOf(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

// ========== 计算 ISO 周数 ==========
function getWeekNumber(d: Date): number {
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  // Thursday in current week decides the year
  const dayNum = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNum + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay)
  const diff = target.getTime() - firstThursday.getTime()
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}

function getWeekDates(sunday: Date): string[] {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// ========== 主组件 ==========
export function WeeklySchedule({ onToggle }: { onToggle: (id: number) => void }) {
  const todayStr = getTodayStr()
  const [weekOffset, setWeekOffset] = useState(0)
  const [todosByDate, setTodosByDate] = useState<Record<string, Todo[]>>({})
  const [loading, setLoading] = useState(true)
  const [pickerDate, setPickerDate] = useState(getTodayStr())

  const baseSunday = getSundayOf(new Date())
  baseSunday.setDate(baseSunday.getDate() + weekOffset * 7)
  const weekDates = getWeekDates(baseSunday)
  const weekNum = getWeekNumber(baseSunday)

  const loadWeek = async () => {
    setLoading(true)
    try {
      const all = await api.getTodos()
      const start = weekDates[0]; const end = weekDates[6]
      const filtered = all.filter((t: Todo) => !t.isImportant && t.date >= start && t.date <= end)
      const grouped: Record<string, Todo[]> = {}
      weekDates.forEach((d) => { grouped[d] = [] })
      filtered.forEach((t: Todo) => { if (grouped[t.date]) grouped[t.date].push(t) })
      setTodosByDate(grouped)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    loadWeek()
  }, [weekOffset])

  const handleToggle = async (id: number, date: string) => {
    const todo = todosByDate[date]?.find((t) => t.id === id)
    if (!todo) return
    const newCompleted = !todo.completed
    onToggle(id)
    setTodosByDate((prev) => {
      const updated = { ...prev }
      updated[date] = prev[date].map((t) =>
        t.id === id ? { ...t, completed: newCompleted } : t,
      )
      return updated
    })
  }

  const goToWeek = (dateStr: string) => {
    const picked = new Date(dateStr + 'T00:00:00')
    const currentSunday = getSundayOf(new Date())
    const diffDays = Math.round((picked.getTime() - currentSunday.getTime()) / (24 * 60 * 60 * 1000))
    setWeekOffset(Math.floor(diffDays / 7))
  }

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPickerDate(e.target.value)
    goToWeek(e.target.value)
  }

  const prevWeek = () => setWeekOffset((o) => o - 1)
  const nextWeek = () => setWeekOffset((o) => o + 1)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F2BF80] border-t-[#D97D48]" />
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-4">
      {/* 标题 + 周数 + 日期选择 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">
          Weekly Schedules | 周日程
        </h2>
        <div className="flex items-center gap-3">
          {/* 月份 */}
          <span className="text-sm font-bold text-gray-600">
            {year}年{month}月
          </span>
          {/* 周数导航 */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevWeek}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex h-6 min-w-[3rem] items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
              W{weekNum}
            </span>
            <button
              onClick={nextWeek}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {/* 日期选择器 */}
          <input
            type="date"
            value={pickerDate}
            onChange={handlePickerChange}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-[#D97D48]/30"
          />
        </div>
      </div>

      {/* 7 列网格 */}
      <div className="grid grid-cols-7 divide-x divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {/* 表头 */}
        {weekDays.map((wd, i) => {
          const dateStr = weekDates[i]
          const d = new Date(dateStr + 'T00:00:00')
          const dayNum = d.getDate()
          const isToday = dateStr === todayStr
          return (
            <div key={wd} className="flex flex-col items-center pt-3 pb-2">
              <span className="text-xs text-gray-400">{wd}</span>
              {isToday ? (
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#A64833] text-xs font-bold text-white">
                  {dayNum}
                </span>
              ) : (
                <span className="mt-1 text-sm font-semibold text-gray-600">{dayNum}</span>
              )}
            </div>
          )
        })}

        {/* 任务列 */}
        {weekDates.map((dateStr, colIdx) => {
          const dayTodos = todosByDate[dateStr] || []
          const isToday = dateStr === todayStr
          return (
            <div
              key={dateStr}
              className={`flex flex-col gap-1.5 p-2 ${isToday ? 'bg-[#F2BF80]/10' : ''}`}
            >
              {dayTodos.length === 0 ? (
                <p className="py-4 text-center text-[10px] text-gray-300">暂无</p>
              ) : (
                dayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`rounded-md border p-2 ${
                      todo.completed
                        ? 'border-gray-100 bg-gray-50'
                        : 'border-gray-100 bg-white shadow-sm'
                    }`}
                  >
                    <p
                      className={`line-clamp-2 text-sm font-medium ${
                        todo.completed ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}
                    >
                      {todo.title}
                    </p>
                    <button
                      onClick={() => handleToggle(todo.id!, dateStr)}
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded ${
                          todo.completed ? 'bg-[#D97D48]' : 'border-2 border-gray-300'
                        }`}
                      >
                        {todo.completed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </span>
                      完成
                    </button>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
