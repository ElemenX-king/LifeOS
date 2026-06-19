import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import type { Habit, HabitRecord, HabitType } from '../types'

// ========== 动态计算当月天数 ==========
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'))

// ========== 渲染单个格子 ==========
type CellStatus = 'none' | 'completed' | 'failed'

function HabitCell({ status, type, day }: { status: CellStatus; type: HabitType; day: string }) {
  const base = 'w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors duration-100 cursor-default'

  if (type === 'positive') {
    if (status === 'completed')
      return <div className={`${base} bg-[#D97D48]`} title={`${day}日 · 已完成`} />
    return <div className={`${base} bg-[#F2BF80]/15`} title={`${day}日 · 未打卡`} />
  }

  if (status === 'failed')
    return (
      <div className={`${base} bg-stone-100`} title={`${day}日 · 破戒`}>
        <span className="text-xs font-bold leading-none text-gray-400 select-none">X</span>
      </div>
    )
    return <div className={`${base} bg-[#F2BF80]/15`} title={`${day}日 · 守住`} />
}

// ========== Props ==========
interface MonthlyHeatmapProps {
  habits: Habit[]
  monthRecords: HabitRecord[]
  onAddHabit: (name: string, type: HabitType) => void
}

// ========== 主组件 ==========
export function MonthlyHeatmap({ habits, monthRecords, onAddHabit }: MonthlyHeatmapProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitType, setNewHabitType] = useState<HabitType>('positive')
  const inputRef = useRef<HTMLInputElement>(null)

  const openAddForm = () => {
    setShowAddForm(true)
    setNewHabitName('')
    setNewHabitType('positive')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleAddHabit = () => {
    const trimmed = newHabitName.trim()
    if (!trimmed) return
    onAddHabit(trimmed, newHabitType)
    setShowAddForm(false)
    setNewHabitName('')
  }

  // 为每个习惯构建 30 天的记录映射
  const habitRows = habits.map((h) => {
    const recordMap: Record<string, CellStatus> = {}
    monthRecords
      .filter((r) => r.habitId === h.id)
      .forEach((r) => {
        const day = r.date.slice(8, 10)
        recordMap[day] = r.status as CellStatus
      })
    return { ...h, recordMap }
  })

  return (
    <div className="glass-card rounded-xl p-4">
      {/* 标题区 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">
          Monthly Heatmap | 月度打卡热力
        </h2>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A]"
        >
          <Plus className="h-4 w-4" />
          新建习惯
        </button>
      </div>

      {/* 新增习惯表单 */}
      {showAddForm && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
            placeholder="习惯名称…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <select
            value={newHabitType}
            onChange={(e) => setNewHabitType(e.target.value as HabitType)}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
          >
            <option value="positive">正向打卡</option>
            <option value="negative">反向打卡</option>
          </select>
          <button
            onClick={() => setShowAddForm(false)}
            className="rounded-md px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
          >
            取消
          </button>
          <button
            onClick={handleAddHabit}
            disabled={!newHabitName.trim()}
            className="rounded-md bg-[#D97D48] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            添加
          </button>
        </div>
      )}

      {/* 热力图网格 */}
      {habits.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">点击右上角「新建习惯」开始打卡</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <div className="inline-block min-w-full">
            {/* 表头行 */}
            <div className="flex">
              <div className="sticky left-0 z-20 flex w-32 flex-shrink-0 items-center bg-gray-100 px-2 py-1.5 text-xs font-bold text-gray-500">
                习惯
              </div>
              {days.map((d) => (
                <div
                  key={d}
                  className="flex w-5 flex-shrink-0 items-center justify-center bg-gray-100 text-[11px] font-bold text-gray-400"
                  style={{ marginRight: 3 }}
                >
                  {parseInt(d, 10)}
                </div>
              ))}
            </div>

            {/* 数据行 */}
            {habitRows.map((h) => (
              <div key={h.id} className="flex group">
                <div className="sticky left-0 z-10 flex w-32 flex-shrink-0 items-center gap-1 bg-white px-2 py-1.5 group-hover:bg-gray-50">
                  <span className="truncate text-[13px] font-medium text-gray-700">{h.name}</span>
                  <span
                    className={`flex-shrink-0 rounded px-1 text-[8px] font-medium ${
                      h.type === 'positive' ? 'bg-[#F2BF80]/15 text-[#D97D48]' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {h.type === 'positive' ? '正' : '反'}
                  </span>
                </div>

                {days.map((d) => (
                  <div key={d} className="flex-shrink-0 py-1.5" style={{ marginRight: 3 }}>
                    <HabitCell status={h.recordMap[d] || 'none'} type={h.type} day={d} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
