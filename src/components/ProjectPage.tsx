import { ChevronRight, ChevronDown, Circle, Plus, GanttChartSquare, Table2, List, X, ArrowUp, Check, Trash2, Archive, Pencil } from 'lucide-react'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { GanttBar } from './GanttBar'
import { useProjects } from '../hooks/useProjects'
import type { Project, ExecutionEntry } from '../types'

// ========== 甘特图动态日期 ==========
const todayStr = new Date().toISOString().slice(0, 10)
const DAY_W = 40
const GANTT_RANGE = 30 // 前后各 30 天

function toDate(str: string) { return new Date(str + 'T00:00:00') }
function dateStr(d: Date) { return d.toISOString().slice(0, 10) }

function getGanttDays(center: Date) {
  const days: string[] = []
  const start = new Date(center)
  start.setDate(start.getDate() - GANTT_RANGE)
  for (let i = 0; i <= GANTT_RANGE * 2; i++) {
    days.push(dateStr(new Date(start.getTime() + i * 86400000)))
  }
  return days
}

function safeSetMonth(d: Date, delta: number): Date {
  const nd = new Date(d)
  const targetMonth = nd.getMonth() + delta
  nd.setMonth(targetMonth)
  // 安全回退：如果日期溢出（如 31 -> 无31日的月份），退到该月最后一天
  if (nd.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    nd.setDate(0) // 回退到上月最后一天
  }
  return nd
}

function getBarColor(type: string) {
  const map: Record<string, string> = {
    school: 'bg-[#F2BF80]/15 text-[#D97D48]', company: 'bg-[#F2BF80]/20 text-[#F2B33D]', personal: 'bg-[#D97D48]/10 text-[#D97D48]',
  }
  return map[type] || 'bg-gray-100 text-gray-600'
}

const ROW_H = 'h-12'

// ========== 格式化 ==========
function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function getProgressColor(progress: number) {
  if (progress >= 70) return 'bg-[#D97D48]'
  if (progress >= 30) return 'bg-[#F2B33D]'
  return 'bg-[#A64833]'
}

function getTypeTag(type: string) {
  const map: Record<string, { label: string; class: string }> = {
    school: { label: '学校项目', class: 'bg-blue-50 text-blue-600' },
    company: { label: '公司项目', class: 'bg-amber-50 text-amber-600' },
    personal: { label: '个人项目', class: 'bg-emerald-50 text-emerald-600' },
    execution: { label: '执行条目', class: 'bg-purple-50 text-purple-600' },
  }
  return map[type] || { label: type, class: 'bg-gray-50 text-gray-500' }
}

// ========== 统一网格模板：表头与数据行共用 ==========
const GRID_COLS = 'grid-cols-[minmax(180px,1fr)_90px_70px_140px_110px_110px_160px]'

// ========== 表格列配置 (7列) — 仅用于表头 label ==========
const TABLE_COLUMNS = [
  { label: 'Aa 计划事项' },
  { label: '类型' },
  { label: '目标/指标' },
  { label: '进度' },
  { label: '开始时间' },
  { label: '结束时间' },
  { label: '操作' },
]

// ========== 日历月份 ==========
function getMonthDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  return { daysInMonth, firstDay }
}

// ========== 树形行类型 ==========
type TreeRow = 
  | { kind: 'parent'; data: Project; depth: 0; hasChildren: boolean }
  | { kind: 'sub'; data: Project; depth: 1 }
  | { kind: 'execution'; data: ExecutionEntry; parentProject: Project }

// ========== 所有项目表格列 (8列，多了归档状态) ==========
const ALL_COLS = 'grid-cols-[minmax(180px,1fr)_90px_70px_140px_110px_110px_100px_100px]'
const ALL_LABELS = ['Aa 计划事项', '类型', '目标/指标', '进度', '开始时间', '结束时间', '归档状态', '操作']

// ========== 项目管理页面 ==========
export function ProjectPage() {
  const { projects, executions, addExecution, deleteProject, deleteExecution, archiveProject, updateProject } = useProjects()
  const [currentView, setCurrentView] = useState<'main' | 'project_page' | 'all'>('main')
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [expandedExec, setExpandedExec] = useState<Set<number>>(new Set())

  // Gantt center date
  const [ganttCenterDate, setGanttCenterDate] = useState(new Date('2026-06-19'))
  const ganttDays = getGanttDays(ganttCenterDate)
  const ganttTotal = ganttDays.length
  const ganttTodayIdx = ganttDays.indexOf(todayStr)
  const ganttTodayPct = ganttTodayIdx >= 0 ? (ganttTodayIdx / ganttTotal) * 100 + (0.5 / ganttTotal) * 100 : -1

  // Gantt month labels
  const ganttMonthLabels: { label: string; col: number }[] = []
  let curGMonth = -1
  ganttDays.forEach((d, i) => {
    const m = parseInt(d.slice(5, 7), 10)
    if (m !== curGMonth) { curGMonth = m; ganttMonthLabels.push({ label: `${m}月`, col: i }) }
  })

  // 甘特图滚动到今日居中
  const ganttScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (currentView !== 'main') return
    const el = ganttScrollRef.current
    if (!el || ganttTodayIdx < 0) return
    // 用 double rAF 确保 DOM 完全布局后再计算
    let tries = 0
    const tryScroll = () => {
      if (el.clientWidth > 0) {
        const scrollTarget = ganttTodayIdx * DAY_W - el.clientWidth / 2 + DAY_W / 2
        el.scrollLeft = Math.max(0, scrollTarget)
      } else if (tries < 5) {
        tries++
        requestAnimationFrame(tryScroll)
      }
    }
    requestAnimationFrame(tryScroll)
  }, [currentView, ganttCenterDate, ganttTodayIdx])

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSubProject, setModalSubProject] = useState<Project | null>(null)
  const [execName, setExecName] = useState('')
  const [execTarget, setExecTarget] = useState('')

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [dragPreviewRange, setDragPreviewRange] = useState<{ start: string; end: string } | null>(null)

  // Edit modal
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  const openEditProject = (p: Project) => {
    setEditProject(p)
    setEditName(p.name)
    setEditTarget(p.target != null ? String(p.target) : '')
    setEditStart(p.startDate)
    setEditEnd(p.endDate)
    setEditProjectOpen(true)
  }

  const saveEditProject = () => {
    if (!editProject || !editName.trim()) return
    updateProject(editProject.id!, {
      name: editName.trim(),
      target: editTarget ? parseInt(editTarget, 10) : undefined,
      startDate: editStart,
      endDate: editEnd,
    })
    setEditProjectOpen(false)
  }

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const toggleExecExpand = (id: number) => {
    setExpandedExec((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // 构建树形行 — 项目管理视图
  const buildTreeRows = (includeArchived: boolean): TreeRow[] => {
    const rows: TreeRow[] = []
    const allParents = includeArchived ? projects.filter((p) => !p.parentId) : projects.filter((p) => !p.parentId && !p.isArchived)
    allParents.forEach((parent) => {
      rows.push({ kind: 'parent', data: parent, depth: 0, hasChildren: projects.some((c) => c.parentId === parent.id) })
      if (collapsed.has(parent.id!)) return
      projects.filter((c) => c.parentId === parent.id).forEach((sub) => {
        rows.push({ kind: 'sub', data: sub, depth: 1 })
        if (expandedExec.has(sub.id!)) {
          executions.filter((e) => e.subProjectId === sub.id).forEach((e) => {
            rows.push({ kind: 'execution', data: e, parentProject: parent })
          })
        }
      })
    })
    return rows
  }
  const treeRows = buildTreeRows(false)
  const allTreeRows = buildTreeRows(true)

  // ========== 甘特图 flatList（仅父/子项目，不含执行条目） ==========
  const ganttParents = projects.filter((p) => !p.parentId)
  const ganttFlat: (Project & { depth: number; hasChildren: boolean })[] = []
  ganttParents.forEach((parent) => {
    ganttFlat.push({ ...parent, depth: 0, hasChildren: projects.some((c) => c.parentId === parent.id) })
    if (!collapsed.has(parent.id!))
      projects.filter((c) => c.parentId === parent.id).forEach((c) => ganttFlat.push({ ...c, depth: 1, hasChildren: false }))
  })

  // ========== Handlers ==========
  const confirmDeleteProject = () => {
    if (!deleteTarget) return
    deleteProject(deleteTarget.id)
    setDeleteTarget(null)
  }

  const handleDeleteProject = (p: Project) => {
    if (!p.parentId || projects.some((c) => c.parentId === p.id)) {
      // 父项目或有子项目的 — 弹窗确认
      setDeleteTarget({ id: p.id!, name: p.name })
    } else {
      // 无子项目的子项目直接删除
      deleteProject(p.id!)
    }
  }

  // ========== Modal ==========
  const openModal = (sub: Project) => {
    setModalSubProject(sub)
    setExecName('')
    setExecTarget('')
    setModalOpen(true)
  }

  const handleSaveExecution = (e: FormEvent) => {
    e.preventDefault()
    if (!modalSubProject || !execName.trim() || !execTarget) return
    const parent = projects.find((p) => p.id === modalSubProject.parentId)
    if (!parent) return
    addExecution({
      subProjectId: modalSubProject.id!,
      parentId: parent.id!,
      name: execName.trim(),
      target: parseInt(execTarget, 10),
      date: todayStr,
      notes: '',
    })
    setExpandedExec((prev) => new Set(prev).add(modalSubProject.id!))
    setModalOpen(false)
  }

  // ========== 日历数据（支持月份切换） ==========
  const [calOffset, setCalOffset] = useState(0)
  const calDate = new Date(new Date().getFullYear(), new Date().getMonth() + calOffset, 1)
  const calYear = calDate.getFullYear()
  const calMonth = calDate.getMonth()
  const { daysInMonth, firstDay } = getMonthDays(calYear, calMonth)
  const todayDay = calOffset === 0 ? new Date().getDate() : -1

  const calDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d)

  const getExecsForDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return executions.filter((e) => e.date === dateStr)
  }

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-5">

      {/* 标题行 + 视图切换 + 新增按钮 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">Project Overview | 项目总览</h2>
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button onClick={() => setCurrentView('main')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${currentView === 'main' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <GanttChartSquare className="h-3.5 w-3.5" />甘特图
            </button>
            <button onClick={() => setCurrentView('project_page')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${currentView === 'project_page' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Table2 className="h-3.5 w-3.5" />项目管理
            </button>
            <button onClick={() => setCurrentView('all')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${currentView === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <List className="h-3.5 w-3.5" />所有项目
            </button>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A]">
          <Plus className="h-4 w-4" />新建项目
        </button>
      </div>

      {/* ========== 动态内容区 ========== */}

      {currentView === 'main' ? (
        /* ========== 甘特图（动态 ±30 天窗口） ========== */
        <div>
          {/* Gantt 右上角月份切换 */}
          <div className="mb-2 flex items-center justify-end gap-2">
            <button onClick={() => setGanttCenterDate((d) => safeSetMonth(d, -1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <span className="text-sm font-bold text-gray-600">{ganttCenterDate.getFullYear()}年{ganttCenterDate.getMonth() + 1}月</span>
            <button onClick={() => setGanttCenterDate((d) => safeSetMonth(d, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex">
            <div className="w-56 flex-shrink-0 border-r border-gray-200">
              <div className={`flex items-center border-b border-gray-100 px-4 ${ROW_H}`}><span className="text-xs text-gray-400">Aa 计划事项</span></div>
              {ganttFlat.map((p) => (
                <div key={p.id} className={`flex items-center gap-2 border-b border-gray-100 bg-white px-4 ${ROW_H} ${p.depth === 0 ? 'font-medium' : 'text-gray-500'}`}
                  style={{ paddingLeft: `${16 + p.depth * 20}px` }}>
                  {p.hasChildren ? (
                    <button onClick={() => toggleCollapse(p.id!)} className="flex-shrink-0 text-gray-400">
                      {collapsed.has(p.id!) ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  ) : <span className="w-3.5 flex-shrink-0" />}
                  <Circle className="h-3 w-3 flex-shrink-0 text-gray-400" fill="currentColor" />
                  <span className="truncate text-sm text-gray-700">{p.name}</span>
                </div>
              ))}
            </div>
            <div ref={ganttScrollRef} className="flex-1 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-50">
              <div style={{ minWidth: ganttTotal * DAY_W }}>
                <div className="border-b border-gray-100">
                  <div className="flex">
                    {ganttMonthLabels.map((m, mi) => {
                      const prevCol = mi > 0 ? ganttMonthLabels[mi - 1].col : 0
                      return <div key={m.col} className="flex-shrink-0 py-1 text-[10px] font-medium text-gray-400" style={{ marginLeft: (m.col - prevCol) * DAY_W }}>{m.label}</div>
                    })}
                  </div>
                  <div className="flex">
                    {ganttDays.map((d) => {
                      const dayNum = parseInt(d.slice(8, 10), 10)
                      const isStart = dragPreviewRange?.start === d
                      const isEnd = dragPreviewRange?.end === d
                      const isInRange = dragPreviewRange && d >= dragPreviewRange.start && d <= dragPreviewRange.end && d !== dragPreviewRange.start && d !== dragPreviewRange.end
                      return <div key={d}
                        className={`flex flex-shrink-0 items-center justify-center text-[10px] transition-colors
                          ${isStart ? 'bg-blue-50 text-blue-600 font-bold rounded-t-md' : ''}
                          ${isEnd ? 'bg-orange-50 text-orange-600 font-bold rounded-t-md' : ''}
                          ${isInRange ? 'bg-gray-50/80' : ''}
                          ${!isStart && !isEnd && !isInRange ? 'text-gray-400' : ''}`}
                        style={{ width: DAY_W, height: 24 }}>
                        {d === todayStr ? <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${isStart || isEnd || isInRange ? 'bg-red-400' : 'bg-red-500'}`}>{dayNum}</span> : dayNum}
                      </div>
                    })}
                  </div>
                </div>
                <div className="relative">
                  {ganttTodayPct >= 0 && <div className="pointer-events-none absolute top-0 z-10 w-px bg-red-400" style={{ left: `${ganttTodayPct}%`, height: ganttFlat.length * 48 }} />}
                  {/* 拖拽预览垂直辅助线 */}
                  {dragPreviewRange && (
                    <>
                      {(() => {
                        const sIdx = ganttDays.indexOf(dragPreviewRange.start)
                        const eIdx = ganttDays.indexOf(dragPreviewRange.end)
                        return (
                          <>
                            {sIdx >= 0 && (
                              <div className="pointer-events-none absolute top-0 z-5" style={{ left: `${(sIdx / ganttTotal) * 100}%`, width: `${(1 / ganttTotal) * 100}%`, height: ganttFlat.length * 48 }}>
                                <div className="h-full w-full border-x border-blue-300/40 bg-blue-50/20" />
                              </div>
                            )}
                            {eIdx >= 0 && (
                              <div className="pointer-events-none absolute top-0 z-5" style={{ left: `${(eIdx / ganttTotal) * 100}%`, width: `${(1 / ganttTotal) * 100}%`, height: ganttFlat.length * 48 }}>
                                <div className="h-full w-full border-x border-orange-300/40 bg-orange-50/20" />
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </>
                  )}
                  {ganttFlat.map((p) => (
                    <div key={p.id} className={`relative border-b border-gray-100 ${ROW_H}`}>
                      <GanttBar
                        project={p}
                        cellWidth={DAY_W}
                        days={ganttDays}
                        totalDays={ganttTotal}
                        barColor={getBarColor(p.type)}
                        rowHeight={ROW_H}
                        onUpdate={(id, startDate, endDate) => updateProject(id, { startDate, endDate })}
                        onDragPreview={setDragPreviewRange}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : (
        /* ========== 项目管理 / 所有项目 视图 ========== */
        <div className="space-y-4">
          {/* ===== Tree Table ===== */}
          <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              <div style={{ minWidth: currentView === 'all' ? 1024 : 960 }}>

                {/* 表头 */}
                {currentView === 'all' ? (
                  <div className={`grid ${ALL_COLS} border-b border-gray-100 bg-gray-50/50`}>
                    {ALL_LABELS.map((l) => <div key={l} className="flex items-center px-3 py-2.5 text-[11px] font-medium text-gray-400">{l}</div>)}
                  </div>
                ) : (
                  <div className={`grid ${GRID_COLS} border-b border-gray-100 bg-gray-50/50`}>
                    {TABLE_COLUMNS.map((col) => <div key={col.label} className="flex items-center px-3 py-2.5 text-[11px] font-medium text-gray-400">{col.label}</div>)}
                  </div>
                )}

                {/* 数据行 */}
                {(currentView === 'all' ? allTreeRows : treeRows).map((row) => {
                  const isAllView = currentView === 'all'

                  if (row.kind === 'parent') {
                    const p = row.data
                    return (
                      <div key={`p-${p.id}`} className={`group ${isAllView ? `grid ${ALL_COLS}` : `grid ${GRID_COLS}`} border-b border-gray-50 transition-colors hover:bg-gray-50/60`} style={{ minHeight: 48 }}>
                        <div className="flex items-center gap-2 px-3 py-3">
                          {row.hasChildren ? (
                            <button onClick={() => toggleCollapse(p.id!)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                              {collapsed.has(p.id!) ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          ) : <span className="w-3.5 flex-shrink-0" />}
                          <Circle className="h-3 w-3 flex-shrink-0 text-gray-500" fill="currentColor" />
                          <span className="truncate text-sm font-medium text-gray-800">{p.name}</span>
                        </div>
                        <div className="flex items-center px-3 py-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${getTypeTag(p.type).class}`}>{getTypeTag(p.type).label}</span>
                        </div>
                        <div className="flex items-center px-3 py-3"><span className={p.depth ? 'text-sm text-gray-600' : 'text-sm font-medium text-gray-700'}>{p.target != null ? p.target : '—'}</span></div>
                        <div className="flex items-center gap-2 px-3 py-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(p.progress)}`} style={{ width: `${Math.min(p.progress, 100)}%` }} />
                          </div>
                          <span className="flex-shrink-0 text-[11px] font-medium text-gray-500 w-8 text-right">{p.progress}%</span>
                        </div>
                        <div className="flex items-center px-3 py-3"><span className="text-sm text-gray-500">{fmtDate(p.startDate)}</span></div>
                        <div className="flex items-center px-3 py-3"><span className="text-sm text-gray-500">{fmtDate(p.endDate)}</span></div>
                        {isAllView && (
                          <div className="flex items-center px-3 py-3">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${p.isArchived ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>
                              {p.isArchived ? '已归档' : '活跃中'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-0.5 px-2 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditProject(p)} title="编辑"
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-600">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {!isAllView && (
                            <button onClick={() => archiveProject(p.id!)} title="归档"
                              className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:bg-amber-50 hover:text-amber-500">
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteProject(p)} title="删除"
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  if (row.kind === 'sub') {
                    const p = row.data
                    return (
                      <div key={`s-${p.id}`} className={`group ${isAllView ? `grid ${ALL_COLS}` : `grid ${GRID_COLS}`} border-b border-gray-50 transition-colors hover:bg-gray-50/60`} style={{ minHeight: 48 }}>
                        <div className="flex items-center gap-2 px-3 py-3 pl-8">
                          <button onClick={() => toggleExecExpand(p.id!)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                            {expandedExec.has(p.id!) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </button>
                          <Circle className="h-3 w-3 flex-shrink-0 text-gray-300" fill="currentColor" />
                          <span className="truncate text-sm text-gray-600">{p.name}</span>
                        </div>
                        <div className="flex items-center px-3 py-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${getTypeTag(p.type).class}`}>{getTypeTag(p.type).label}</span>
                        </div>
                        <div className="flex items-center px-3 py-3"><span className="text-sm text-gray-600">{p.target != null ? p.target : '—'}</span></div>
                        <div className="flex items-center gap-2 px-3 py-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(p.progress)}`} style={{ width: `${Math.min(p.progress, 100)}%` }} />
                          </div>
                          <span className="flex-shrink-0 text-[11px] font-medium text-gray-500 w-8 text-right">{p.progress}%</span>
                        </div>
                        <div className="flex items-center px-3 py-3"><span className="text-sm text-gray-500">{fmtDate(p.startDate)}</span></div>
                        <div className="flex items-center px-3 py-3"><span className="text-sm text-gray-500">{fmtDate(p.endDate)}</span></div>
                        {isAllView && <div className="flex items-center px-3 py-3"><span className="text-xs text-gray-400">—</span></div>}
                        <div className="flex items-center justify-end gap-0.5 px-2 py-3">
                          {!isAllView && (
                            <button onClick={() => openModal(p)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
                              <Plus className="h-3 w-3" />添加执行
                            </button>
                          )}
                          <button onClick={() => handleDeleteProject(p)} title="删除"
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  if (row.kind === 'execution') {
                    const e = row.data
                    return (
                      <div key={`ex-${e.id}`} className={`group ${isAllView ? `grid ${ALL_COLS}` : `grid ${GRID_COLS}`} border-b border-gray-50 bg-gray-50/30 transition-colors hover:bg-gray-50/60`} style={{ minHeight: 44 }}>
                        <div className="flex items-center gap-2 px-3 py-2 pl-14">
                          <span className="w-3 flex-shrink-0" />
                          <Circle className="h-2.5 w-2.5 flex-shrink-0 text-gray-300" fill="currentColor" />
                          <span className="truncate text-xs text-gray-500">{e.name}</span>
                        </div>
                        <div className="flex items-center px-3 py-2">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${getTypeTag('execution').class}`}>{getTypeTag('execution').label}</span>
                        </div>
                        <div className="flex items-center px-3 py-2"><span className="text-xs text-gray-500">{e.target}</span></div>
                        <div className="flex items-center gap-1.5 px-3 py-2"><span className="text-xs text-gray-400">完成+{e.target}</span></div>
                        <div className="flex items-center px-3 py-2"><span className="text-xs text-gray-400">{fmtDate(e.date)}</span></div>
                        <div className="flex items-center px-3 py-2"><span className="text-xs text-gray-400">--</span></div>
                        {isAllView && <div className="flex items-center px-3 py-2"><span className="text-xs text-gray-400">—</span></div>}
                        <div className="flex items-center justify-end px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteExecution(e.id!)} title="删除"
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}

                {(currentView === 'all' ? allTreeRows : treeRows).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Circle className="mb-3 h-8 w-8 text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">暂无项目数据</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Done Calendar | 执行日历 — 全局常驻底部 ===== */}
      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">Done Calendar | 执行日历</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setCalOffset((o) => o - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <button onClick={() => setCalOffset(0)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${calOffset === 0 ? 'bg-[#D97D48] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  今天
                </button>
                <button onClick={() => setCalOffset((o) => o + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="ml-2 text-sm font-bold text-gray-600">{calYear}年{calMonth + 1}月</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((wd) => (
                  <div key={wd} className="px-2 py-2 text-center text-xs font-medium text-gray-400">{wd}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr">
                {calDays.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-gray-50 bg-gray-50/30" />

                  const dayExecs = getExecsForDay(day)
                  const isToday = day === todayDay

                  return (
                    <div key={`day-${day}`} className={`min-h-[90px] border-b border-r border-gray-50 p-1.5 ${isToday ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex justify-end mb-1">
                        {isToday ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{day}</span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-400">{day}</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayExecs.map((ex) => {
                          const sub = projects.find((p) => p.id === ex.subProjectId)
                          return (
                            <div key={ex.id} className="rounded-md border border-gray-100 bg-white px-1.5 py-1 shadow-sm">
                              <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                <ArrowUp className="h-2 w-2" />
                                <span className="truncate">{sub?.name || '—'}</span>
                              </div>
                              <div className="mt-0.5 text-[11px] font-medium text-gray-700 flex items-center gap-1">
                                <Circle className="h-1.5 w-1.5 flex-shrink-0 text-[#D97D48]" fill="currentColor" />
                                <span className="truncate">【执行】{ex.name}</span>
                              </div>
                              <span className="mt-0.5 inline-flex items-center rounded-sm bg-emerald-50 px-1 py-0.5 text-[9px] font-medium text-emerald-600">
                                <Check className="mr-0.5 h-2 w-2" />完成+{ex.target}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

      {/* ========== 添加执行弹窗 ========== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">添加执行记录</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            {modalSubProject && (
              <p className="mb-4 text-xs text-gray-500">所属子项目：<span className="font-medium text-gray-700">{modalSubProject.name}</span></p>
            )}
            <form onSubmit={handleSaveExecution} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">执行内容/名称</label>
                <input type="text" value={execName} onChange={(e) => setExecName(e.target.value)} placeholder="如：完成第一章阅读"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">目标</label>
                <input type="number" min={0} value={execTarget} onChange={(e) => setExecTarget(e.target.value)} placeholder="如 2"
                  className="w-32 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                <button type="submit" disabled={!execName.trim() || !execTarget}
                  className="rounded-md bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== 编辑项目弹窗 ========== */}
      {editProjectOpen && editProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditProjectOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">编辑项目</h3>
              <button onClick={() => setEditProjectOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">项目名称</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">目标/指标</label>
                <input type="number" min={0} value={editTarget} onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">开始时间</label>
                  <input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">结束时间</label>
                  <input type="date" min={editStart} value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditProjectOpen(false)} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                <button onClick={saveEditProject} disabled={!editName.trim()}
                  className="rounded-md bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== 删除确认弹窗 ========== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold text-gray-800">确认删除</h3>
            <p className="mb-4 text-sm text-gray-600">
              确定要删除项目「<span className="font-medium text-gray-800">{deleteTarget.name}</span>」及其包含的所有子任务/执行吗？此操作不可逆。
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button onClick={confirmDeleteProject} className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
