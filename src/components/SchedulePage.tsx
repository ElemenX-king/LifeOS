import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { Plus, Trash2, Circle, ChevronRight, ChevronLeft, Pencil, X } from 'lucide-react'
import { db } from '../db/db'
import type { Priority, Todo } from '../types'

// ========== 格式化 ==========
const todayStr = new Date().toISOString().slice(0, 10)
const PAGE_SIZE = 20

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function isOverdue(dateStr: string) {
  return dateStr < todayStr
}

// ========== 列定义 ==========
const GRID_COLS = 'grid-cols-[2fr_100px_90px_120px_140px_80px]'
const COL_LABELS = ['Aa 事项', '类型', '优先级', '时间', '状态', '操作']

// ========== 优先级配置 ==========
const priorityConfig: Record<string, { label: string; class: string }> = {
  high: { label: '高', class: 'bg-[#A64833]/10 text-[#A64833]' },
  medium: { label: '中', class: 'bg-[#D97D48]/10 text-[#D97D48]' },
  low: { label: '低', class: 'bg-[#F2BF80]/15 text-[#D97D48]' },
}

// ========== 日程类型 ==========
interface ScheduleItem {
  id: number
  title: string
  type: 'daily' | 'important'
  priority: string
  date: string
  isCompleted: boolean
}

// ========== 分页组件 ==========
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)}
            className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${page === p ? 'bg-[#D97D48] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ========== 页面组件 ==========
export function SchedulePage() {
  const [allTodos, setAllTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const all = await db.todos.toArray()
    all.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    setAllTodos(all)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // 构建日程列表（全部），按优先级 > 时间排序
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, '-': 3 }
  const scheduleItems: ScheduleItem[] = allTodos
    .map((t) => ({
      id: t.id!,
      title: t.title,
      type: t.isImportant ? 'important' as const : 'daily' as const,
      priority: t.isImportant ? '-' : t.priority,
      date: t.date,
      isCompleted: t.completed,
    }))
    .sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 99
      const pb = priorityOrder[b.priority] ?? 99
      if (pa !== pb) return pa - pb
      return a.date.localeCompare(b.date)
    })

  const totalItems = scheduleItems.length
  const pagedItems = scheduleItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 添加表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addType, setAddType] = useState<'daily' | 'important'>('daily')
  const [addPriority, setAddPriority] = useState<Priority>('medium')
  const [addDate, setAddDate] = useState(todayStr)
  const inputRef = useRef<HTMLInputElement>(null)

  // 编辑弹窗
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('medium')
  const [editDate, setEditDate] = useState('')

  const openEdit = (item: ScheduleItem) => {
    setEditItem(item)
    setEditTitle(item.title)
    setEditPriority((item.type === 'important' ? 'medium' : item.priority) as Priority)
    setEditDate(item.date)
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editItem || !editTitle.trim()) return
    await db.todos.update(editItem.id, {
      title: editTitle.trim(),
      priority: editItem.type === 'important' ? 'medium' : editPriority,
      date: editDate,
    })
    setEditOpen(false)
    loadAll()
  }

  const openAddForm = () => {
    setShowAddForm(true)
    setAddTitle('')
    setAddType('daily')
    setAddPriority('medium')
    setAddDate(todayStr)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!addTitle.trim()) return
    const now = Date.now()
    if (addType === 'important') {
      await db.todos.add({ title: addTitle.trim(), completed: false, priority: 'medium', category: 'other', date: addDate, dueDate: addDate, isImportant: true, createdAt: now, updatedAt: now })
    } else {
      await db.todos.add({ title: addTitle.trim(), completed: false, priority: addPriority, category: 'other', date: addDate, createdAt: now, updatedAt: now })
    }
    setShowAddForm(false)
    loadAll()
  }

  const handleDelete = async (id: number) => {
    await db.todos.delete(id)
    loadAll()
    // 如果当前页变空了，回退一页
    if (pagedItems.length === 1 && page > 1) setPage((p) => p - 1)
  }

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-5">
      {/* 标题 + 添加按钮 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">
          Schedules | 全部日程
        </h2>
        {!showAddForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A]"
          >
            <Plus className="h-4 w-4" />添加日程
          </button>
        )}
      </div>

      {/* 添加表单 — 紧凑单行 */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd(e)}
            placeholder="日程名称…"
            className="min-w-[140px] flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as 'daily' | 'important')}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
          >
            <option value="daily">日常任务</option>
            <option value="important">重要日程</option>
          </select>
          {addType === 'daily' && (
            <select
              value={addPriority}
              onChange={(e) => setAddPriority(e.target.value as Priority)}
              className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          )}
          <input
            type="date"
            value={addDate}
            onChange={(e) => setAddDate(e.target.value)}
            className="w-32 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
          />
          <button type="button" onClick={() => setShowAddForm(false)}
            className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-gray-400 hover:text-gray-600">取消</button>
          <button type="submit" disabled={!addTitle.trim()}
            className="flex-shrink-0 rounded-md bg-[#D97D48] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40">添加</button>
        </form>
      )}

      {/* 表格 */}
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <div style={{ minWidth: 760 }}>

            {/* 表头 */}
            <div className={`grid ${GRID_COLS} border-b border-gray-100 bg-gray-50/50`}>
              {COL_LABELS.map((l) => (
                <div key={l} className="flex items-center px-3 py-2.5 text-[11px] font-medium text-gray-400">{l}</div>
              ))}
            </div>

            {/* 数据行 */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#F2BF80] border-t-[#D97D48]" />
              </div>
            ) : pagedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Circle className="mb-3 h-8 w-8 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">暂无日程</p>
                <p className="mt-1 text-xs">点击上方「添加日程」开始</p>
              </div>
            ) : (
              pagedItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className={`group grid ${GRID_COLS} border-b border-gray-50 transition-colors hover:bg-gray-50/60`} style={{ minHeight: 48 }}>

                  {/* Aa 事项 */}
                  <div className="flex items-center gap-2 px-3 py-3">
                    <Circle className={`h-3 w-3 flex-shrink-0 ${item.type === 'important' ? 'text-[#D97D48]' : 'text-gray-400'}`} fill="currentColor" />
                    <span className={`truncate text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'font-medium text-gray-800'}`}>
                      {item.title}
                    </span>
                  </div>

                  {/* 类型 */}
                  <div className="flex items-center px-3 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${item.type === 'important' ? 'bg-[#F2BF80]/15 text-[#D97D48]' : 'bg-[#F2BF80]/10 text-[#D97D48]'}`}>
                      {item.type === 'important' ? '重要日程' : '日常任务'}
                    </span>
                  </div>

                  {/* 优先级 */}
                  <div className="flex items-center px-3 py-3">
                    {item.type === 'important' ? (
                      <span className="text-sm text-gray-400">-</span>
                    ) : (
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityConfig[item.priority]?.class || ''}`}>
                        {priorityConfig[item.priority]?.label || item.priority}
                      </span>
                    )}
                  </div>

                  {/* 时间 */}
                  <div className="flex items-center px-3 py-3">
                    <span className="text-sm text-gray-500">{fmtDate(item.date)}</span>
                  </div>

                  {/* 状态 — 纯文字 */}
                  <div className="flex items-center px-3 py-3">
                    {item.type === 'daily' ? (
                      <span className={`text-xs font-medium ${item.isCompleted ? 'text-[#D97D48]' : 'text-gray-500'}`}>
                        {item.isCompleted ? '已完成' : '未完成'}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${isOverdue(item.date) ? 'bg-gray-100 text-gray-500' : 'bg-[#F2BF80]/15 text-[#D97D48]'}`}>
                        {isOverdue(item.date) ? '已通过' : '未到期'}
                      </span>
                    )}
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center justify-end gap-0.5 px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} title="编辑"
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} title="删除"
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:bg-[#A64833]/10 hover:text-[#A64833]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 分页 */}
      <Pagination page={page} total={totalItems} onChange={setPage} />

      {/* ========== 编辑弹窗 ========== */}
      {editOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">编辑日程</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">日程名称</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30" autoFocus />
              </div>
              {editItem.type === 'daily' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">优先级</label>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none">
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">日期</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditOpen(false)} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                <button onClick={saveEdit} disabled={!editTitle.trim()}
                  className="rounded-md bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
