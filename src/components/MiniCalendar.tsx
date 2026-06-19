import { Moon, ArrowRight } from 'lucide-react'
import type { Todo } from '../types'

interface MiniCalendarProps {
  importantTodos: Todo[]
}

// ========== 日历计算 ==========
const now = new Date()
const YEAR = now.getFullYear()
const MONTH = now.getMonth() // 0-based
const todayStr = now.toISOString().slice(0, 10)

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function getCalendarMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []

  // 前半部分空位
  for (let i = 0; i < firstDay; i++) week.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function getWeekNumber(d: number): number {
  const date = new Date(YEAR, MONTH, d)
  const jan1 = new Date(YEAR, 0, 1)
  const diff = (date.getTime() - jan1.getTime()) / 86400000
  return Math.ceil((diff + jan1.getDay() + 1) / 7)
}

function dateStr(day: number) {
  return `${YEAR}-${String(MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ========== 主组件 ==========
export function MiniCalendar({ importantTodos }: MiniCalendarProps) {
  const matrix = getCalendarMatrix(YEAR, MONTH)
  const importantDays = new Set(importantTodos.map((t) => parseInt(t.date.slice(8, 10), 10)))

  return (
    <div>
      {/* 大标题 */}
      <h2 className="border-b border-t border-gray-100 py-6 text-center text-5xl font-serif font-bold text-black">
        {monthNames[MONTH]}
      </h2>

      {/* 副标题 */}
      <div className="mb-4 flex items-center gap-2 pt-2">
        <Moon className="h-5 w-5 text-[#F2B33D]" fill="currentColor" />
        <span className="text-2xl font-bold text-gray-800">
          {YEAR}/{String(MONTH + 1).padStart(2, '0')}
        </span>
      </div>

      {/* 日历网格 */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
        {/* 表头 */}
        <div className="mb-1 grid grid-cols-8 border-b border-gray-100 pb-1 text-center text-[10px] font-medium text-gray-400">
          <div>week</div>
          <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
        </div>

        {/* 数据行 */}
        <div className="space-y-0.5">
          {matrix.map((week, wi) => (
            <div key={wi} className="grid grid-cols-8 text-center text-xs">
              {/* 周数 */}
              {(() => {
                const firstValid = week.find((d) => d !== null)
                const wn = firstValid ? getWeekNumber(firstValid) : ''
                return <div className="flex items-center justify-center font-bold text-gray-800">{wn ? `w-${wn}` : ''}</div>
              })()}

              {week.map((day, di) => {
                if (day === null) return <div key={di} className="py-0.5 text-gray-300">__</div>

                const ds = dateStr(day)
                const isToday = ds === todayStr
                const isPast = ds < todayStr
                const isImportant = importantDays.has(day)

                if (isImportant) {
                  return (
                    <div key={di} className="rounded bg-[#F2BF80]/15 py-0.5 font-bold text-[#D97D48]">
                      {day}
                    </div>
                  )
                }
                if (isPast) {
                  return (
                    <div key={di} className="rounded bg-[#F2BF80]/8 py-0.5 italic text-[#593325]/50 line-through">
                      {day}
                    </div>
                  )
                }
                if (isToday) {
                  return (
                    <div key={di} className="rounded bg-[#A64833] py-0.5 font-bold text-white">
                      {day}
                    </div>
                  )
                }
                return <div key={di} className="py-0.5 font-bold text-gray-800">{day}</div>
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 重要日程区 */}
      {importantTodos.length > 0 && (
        <div>
          <div className="rounded-md bg-[#F2BF80]/15 py-1 text-center text-sm font-medium text-[#D97D48]">
            重要日程
          </div>
          <div className="mt-2 space-y-1">
            {importantTodos.slice(0, 5).map((todo) => {
              const dayNum = parseInt(todo.date.slice(8, 10), 10)
              return (
                <div key={todo.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 border-gray-200" />
                  <span className="rounded bg-[#F2BF80]/20 px-1 text-xs font-bold text-[#D97D48]">{dayNum}</span>
                  <ArrowRight className="h-3 w-3 text-gray-300" />
                  <span className="text-[#593325]/60">{todo.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
