import { useState, useRef, type FormEvent } from 'react'
import { Plus, Trash2, Calendar, Clock, Pencil, X } from 'lucide-react'
import type { Todo, Priority } from '../types'

// [改动] Props：onAdd 增加 date 参数
interface DataTableProps {
  todos: Todo[]
  loading: boolean
  onToggle: (id: number) => void
  onUpdate: (id: number, updates: Partial<Todo>) => void
  onDelete: (id: number) => void
  onAdd: (title: string, priority: Priority, date: string) => void
}

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  high: { label: '高', class: 'tag-red' },
  medium: { label: '中', class: 'tag-amber' },
  low: { label: '低', class: 'tag-blue' },
}

// [改动] 表头：日期列加宽至 160px
const COLUMNS = [
  { key: 'title', label: '事项', width: '1fr' },
  { key: 'priority', label: '优先级', width: '100px' },
  { key: 'date', label: '日期', width: '160px' },
  { key: 'actions', label: '操作', width: '80px' },
]

// [改动] 获取今日日期
function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

// [改动] 辅助：计算逾期天数，生成状态标签
function getStatusTag(todo: Todo): { label: string; class: string } {
  const today = getTodayStr()
  if (todo.date === today) {
    return { label: '今天', class: 'tag-today' }
  }
  const d1 = new Date(today + 'T00:00:00')
  const d2 = new Date(todo.date + 'T00:00:00')
  const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
  return { label: `已超出 ${diff} 天`, class: 'tag-overdue' }
}

export function DataTable({
  todos,
  loading,
  onToggle,
  onUpdate,
  onDelete,
  onAdd,
}: DataTableProps) {
  const [addTitle, setAddTitle] = useState('')
  const [addPriority, setAddPriority] = useState<Priority>('medium')
  const [addDate, setAddDate] = useState(getTodayStr())
  const [showAddRow, setShowAddRow] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalTodo, setEditModalTodo] = useState<Todo | null>(null)
  const [editModalTitle, setEditModalTitle] = useState('')
  const [editModalPriority, setEditModalPriority] = useState<Priority>('medium')
  const [editModalDate, setEditModalDate] = useState('')

  // 重置添加表单
  const resetAddForm = () => {
    setAddTitle('')
    setAddPriority('medium')
    setAddDate(getTodayStr())
    setShowAddRow(false)
  }

  const openAddForm = () => {
    setShowAddRow(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = addTitle.trim()
    if (!trimmed) return
    onAdd(trimmed, addPriority, addDate)
    resetAddForm()
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id!)
    setEditTitle(todo.title)
    setTimeout(() => editRef.current?.focus(), 0)
  }

  const openEditModal = (todo: Todo) => {
    setEditModalTodo(todo)
    setEditModalTitle(todo.title)
    setEditModalPriority(todo.priority)
    setEditModalDate(todo.date)
    setEditModalOpen(true)
  }

  const saveEditModal = () => {
    if (!editModalTodo || !editModalTitle.trim()) return
    onUpdate(editModalTodo.id!, {
      title: editModalTitle.trim(),
      priority: editModalPriority,
      date: editModalDate,
    })
    setEditModalOpen(false)
    setEditModalTodo(null)
  }

  const saveEdit = () => {
    if (editingId == null) return
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== todos.find((t) => t.id === editingId)?.title) {
      onUpdate(editingId, { title: trimmed })
    }
    setEditingId(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') setEditingId(null)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${m}月${day}日`
  }

  return (
    <div className="datatable glass-card rounded-xl overflow-hidden">
      {/* 重构标题区：左侧大号衬线标题 + 右侧新建按钮 */}
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">
          Today Tasks | 今日日程
        </h2>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A]"
        >
          <Plus className="h-4 w-4" />
          新建任务
        </button>
      </div>

      {/* 表头 */}
      <div className="datatable-header">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="datatable-header-cell"
            style={{ width: col.width === '1fr' ? undefined : col.width, flex: col.width === '1fr' ? 1 : 'none' }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* 添加表单：由右上角「新建任务」触发展开，位于表头下方 */}
      {showAddRow && (
        <div className="border-b border-gray-100">
          <form onSubmit={handleAdd} className="datatable-add-row">
            <div className="flex flex-1 items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="输入任务名称…"
                className="datatable-add-input"
              />
              <select
                value={addPriority}
                onChange={(e) => setAddPriority(e.target.value as Priority)}
                className="datatable-add-select"
              >
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  className="datatable-add-date"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAddForm}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!addTitle.trim()}
                className="rounded-lg bg-[#D97D48] px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                添加
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 数据行：最多显示 8 条，超出滚动 */}
      <div className="datatable-body-scroll">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#F2BF80] border-t-[#D97D48]" />
              加载中…
            </div>
          </div>
        )}

        {!loading && todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">暂无任务</p>
            <p className="mt-1 text-xs">点击右上角「新建任务」开始</p>
          </div>
        )}

        {!loading &&
          todos.map((todo) => {
            const priorityInfo = priorityConfig[todo.priority]
            const status = getStatusTag(todo)
            const isEditing = editingId === todo.id

            return (
              <div
                key={todo.id}
                className={`datatable-row group ${todo.completed ? 'datatable-row-done' : ''}`}
              >
                {/* 事项列 */}
                <div className="datatable-cell flex-1" style={{ minWidth: 0 }}>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onToggle(todo.id!)}
                      className="flex-shrink-0"
                      aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => {}}
                        className="checkbox-custom"
                      />
                    </button>

                    {isEditing ? (
                      <input
                        ref={editRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleEditKeyDown}
                        className="datatable-edit-input"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(todo)}
                        className={`datatable-title ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                      >
                        {todo.title}
                      </button>
                    )}
                    {/* [改动] 已移除分类彩色标签 */}
                  </div>
                </div>

                {/* 优先级列 */}
                <div className="datatable-cell" style={{ width: 100, flexShrink: 0 }}>
                  <span className={`datatable-tag ${priorityInfo.class}`}>
                    {priorityInfo.label}
                  </span>
                </div>

                {/* [改动] 日期列加宽：附带状态标签 */}
                <div className="datatable-cell" style={{ width: 160, flexShrink: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">{formatDate(todo.date)}</span>
                    <span className={`datatable-tag ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* 操作列 */}
                <div className="datatable-cell" style={{ width: 80, flexShrink: 0 }}>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(todo)} title="编辑"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(todo.id!)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                      aria-label="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* 底部内边距 */}
      <div className="pb-4" />

      {/* ========== 编辑弹窗 ========== */}
      {editModalOpen && editModalTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditModalOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">编辑任务</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">任务名称</label>
                <input type="text" value={editModalTitle} onChange={(e) => setEditModalTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">优先级</label>
                <select value={editModalPriority} onChange={(e) => setEditModalPriority(e.target.value as Priority)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none">
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">日期</label>
                <input type="date" value={editModalDate} onChange={(e) => setEditModalDate(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditModalOpen(false)} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                <button onClick={saveEditModal} disabled={!editModalTitle.trim()}
                  className="rounded-md bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

