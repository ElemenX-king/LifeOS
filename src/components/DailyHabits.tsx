import { useState } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import type { Habit, HabitRecord, HabitType } from '../types'

interface DailyHabitsProps {
  habits: Habit[]
  todayRecords: HabitRecord[]
  loading: boolean
  onToggle: (habitId: number) => void
  onUpdate: (id: number, data: { name: string; type: HabitType }) => void
  onDelete: (id: number) => void
}

export function DailyHabits({ habits, todayRecords, loading, onToggle, onUpdate, onDelete }: DailyHabitsProps) {
  const isChecked = (habitId: number) => todayRecords.some((r) => r.habitId === habitId)
  const [editOpen, setEditOpen] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<HabitType>('positive')

  const openEdit = (h: Habit) => { setEditHabit(h); setEditName(h.name); setEditType(h.type); setEditOpen(true) }
  const saveEdit = () => {
    if (!editHabit || !editName.trim()) return
    onUpdate(editHabit.id!, { name: editName.trim(), type: editType })
    setEditOpen(false)
  }

  return (
    <div>
      {/* 标题 */}
      <h2 className="mb-4 text-3xl font-serif font-bold tracking-tight text-gray-800">
        Habits | 习惯打卡
      </h2>

      {/* 习惯列表 */}
      <div className="glass-card rounded-xl p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-500" />
          </div>
        ) : habits.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            暂无习惯，请在月度打卡板块新建
          </p>
        ) : (
          <div className="space-y-1">
            {habits.map((habit) => {
              const checked = isChecked(habit.id!)
              return (
                <button
                  key={habit.id}
                  onClick={() => onToggle(habit.id!)}
                  className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-50"
                >
                  {/* 复选框 */}
                  <span className="flex-shrink-0">
                    {checked ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#D97D48]">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-200" />
                    )}
                  </span>

                  {/* 类型标签 */}
                  {habit.type === 'positive' ? (
                    <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#F2BF80]/15 text-[#D97D48]">正</span>
                  ) : (
                    <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500">反</span>
                  )}

                  {/* 名称 */}
                  <span className="flex-1 text-sm text-gray-700">{habit.name}</span>

                  {/* 操作图标 */}
                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    <span onClick={(e) => { e.stopPropagation(); openEdit(habit) }} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer">
                      <Pencil className="h-3 w-3" />
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); onDelete(habit.id!) }} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer">
                      <Trash2 className="h-3 w-3" />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {editOpen && editHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">编辑习惯</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">习惯名称</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">类型</label>
                <select value={editType} onChange={(e) => setEditType(e.target.value as HabitType)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none">
                  <option value="positive">正向打卡</option>
                  <option value="negative">反向打卡</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditOpen(false)} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                <button onClick={saveEdit} disabled={!editName.trim()}
                  className="rounded-md bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
