import { Check } from 'lucide-react'
import type { Habit, HabitRecord } from '../types'

interface DailyHabitsProps {
  habits: Habit[]
  todayRecords: HabitRecord[]
  loading: boolean
  onToggle: (habitId: number) => void
}

export function DailyHabits({ habits, todayRecords, loading, onToggle }: DailyHabitsProps) {
  const isChecked = (habitId: number) => todayRecords.some((r) => r.habitId === habitId)

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
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-50"
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
                  <span className="text-sm text-gray-700">{habit.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
