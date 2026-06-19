import { useState, useRef, type FormEvent } from 'react'
import { Plus, Circle, Trash2 } from 'lucide-react'
import type { Todo } from '../types'

interface ImportantReminderProps {
  todos: Todo[]
  loading: boolean
  onAdd: (title: string, dueDate: string) => void
  onDelete: (id: number) => void
}

// ========== 倒计时计算 ==========
function calculateCountdown(dueDate?: string): string {
  if (!dueDate) return '无截止日期'

  const now = new Date()
  const target = new Date(dueDate + 'T23:59:59')
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) return '已过期'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  const remainHours = diffHours % 24

  if (diffDays === 0) {
    if (remainHours === 0) return '>> 就是今天！'
    return `>> 还有${remainHours}小时`
  }
  if (remainHours === 0) return `>> 还有${diffDays}天`
  return `>> 还有${diffDays}天${remainHours}小时`
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ========== 主组件 ==========
export function ImportantReminder({ todos, loading, onAdd, onDelete }: ImportantReminderProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(getTodayStr())
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, dueDate)
    setTitle('')
    setDueDate(getTodayStr())
    setShowAdd(false)
  }

  return (
    <div className="glass-card rounded-xl p-4">
      {/* 标题区 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">
          Important Reminder | 重要日程
        </h2>
        <button
          onClick={() => {
            setShowAdd(true)
            setDueDate(getTodayStr())
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A]"
        >
          <Plus className="h-4 w-4" />
          新建日程
        </button>
      </div>

      {/* 新建表单 */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="重要日程名称…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-md bg-[#D97D48] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            添加
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="rounded-md px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
          >
            取消
          </button>
        </form>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#F2BF80] border-t-[#D97D48]" />
        </div>
      ) : todos.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">暂无重要日程</p>
      ) : (
        <div>
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
            >
              {/* 左侧 */}
              <div className="flex items-center gap-3">
                <Circle className="h-3 w-3 flex-shrink-0 text-gray-300" fill="currentColor" />
                <span className="text-sm text-gray-700">{todo.title}</span>
              </div>

              {/* 右侧：倒计时 + 删除 */}
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 rounded-md bg-[#F2BF80]/15 px-2 py-1 text-xs font-medium text-[#D97D48]">
                  {calculateCountdown(todo.dueDate)}
                </span>
                <button
                  onClick={() => onDelete(todo.id!)}
                  className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                  aria-label="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部内边距 */}
      <div className="pb-2" />
    </div>
  )
}
