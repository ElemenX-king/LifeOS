import { ChevronRight, ChevronDown, Circle, Plus } from 'lucide-react'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { GanttBar } from './GanttBar'
import { useProjects } from '../hooks/useProjects'

// ========== 甘特图动态日期 ==========
const todayStr = new Date().toISOString().slice(0, 10)
const DAY_W = 40
const GANTT_RANGE = 30

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
  if (nd.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    nd.setDate(0)
  }
  return nd
}

// ========== 动态颜色 ==========
function getBarColor(type: string) {
  const map: Record<string, string> = {
    school: 'bg-[#F2BF80]/15 text-[#D97D48]',
    company: 'bg-[#F2BF80]/20 text-[#F2B33D]',
    personal: 'bg-[#D97D48]/10 text-[#D97D48]',
  }
  return map[type] || 'bg-gray-100 text-gray-600'
}

// ========== 行高常量 ==========
const ROW_H = 'h-12'

// ========== 主组件 ==========
export function ProjectOverview() {
  const { projects, addProject, updateProject } = useProjects()
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [ganttCenterDate, setGanttCenterDate] = useState(new Date())

  const ganttDays = getGanttDays(ganttCenterDate)
  const ganttTotal = ganttDays.length
  const ganttTodayIdx = ganttDays.indexOf(todayStr)
  const ganttTodayPct = ganttTodayIdx >= 0 ? (ganttTodayIdx / ganttTotal) * 100 + (0.5 / ganttTotal) * 100 : -1

  const ganttMonthLabels: { label: string; col: number }[] = []
  let curGMonth = -1
  ganttDays.forEach((d, i) => {
    const m = parseInt(d.slice(5, 7), 10)
    if (m !== curGMonth) { curGMonth = m; ganttMonthLabels.push({ label: `${m}月`, col: i }) }
  })

  // 甘特图滚动到今日居中
  const ganttScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ganttScrollRef.current
    if (!el || ganttTodayIdx < 0) return
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
  }, [ganttCenterDate, ganttTodayIdx])

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'school' | 'company' | 'personal'>('personal')
  const [newStart, setNewStart] = useState(todayStr)
  const [newEnd, setNewEnd] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newParentId, setNewParentId] = useState<number | undefined>(undefined)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [dragPreviewRange, setDragPreviewRange] = useState<{ start: string; end: string } | null>(null)

  const toggleCollapse = (id: number) => {
    setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const flatList: (typeof projects[number] & { depth: number; hasChildren: boolean })[] = []
  projects.filter((p) => !p.parentId).forEach((parent) => {
    flatList.push({ ...parent, depth: 0, hasChildren: projects.some((c) => c.parentId === parent.id) })
    if (!collapsed.has(parent.id!))
      projects.filter((c) => c.parentId === parent.id).forEach((c) => flatList.push({ ...c, depth: 1, hasChildren: false }))
  })

  const openAddForm = () => {
    setShowAddForm(true)
    setNewName('')
    setNewType('personal')
    setNewStart(todayStr)
    setNewEnd('')
    setNewTarget('')
    setNewParentId(undefined)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  const handleAddProject = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed || !newEnd) return
    addProject({
      name: trimmed,
      startDate: newStart,
      endDate: newEnd,
      type: newType,
      parentId: newParentId,
      target: newTarget ? parseInt(newTarget, 10) : undefined,
    })
    setShowAddForm(false)
  }

  const parentCandidates = projects.filter((p) => !p.parentId)

  const selectedParent = newParentId ? projects.find((p) => p.id === newParentId) : undefined

  const handleParentChange = (value: string) => {
    const id = value ? parseInt(value) : undefined
    setNewParentId(id)
    if (id) {
      const parent = projects.find((p) => p.id === id)
      if (parent) setNewType(parent.type)
    }
  }

  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-gray-800">Project Overview | 项目总览</h2>
        {!showAddForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A]"
          >
            <Plus className="h-4 w-4" />新建项目
          </button>
        )}
      </div>

      {/* 新增项目表单 — 紧凑单行 */}
      {showAddForm && (
        <form onSubmit={handleAddProject} className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            ref={nameInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProject(e)}
            placeholder="项目名称…"
            className="min-w-[120px] flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'school' | 'company' | 'personal')}
            disabled={!!selectedParent}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="school">学校项目</option>
            <option value="company">公司项目</option>
            <option value="personal">个人项目</option>
          </select>
          <select
            value={newParentId ?? ''}
            onChange={(e) => handleParentChange(e.target.value)}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
          >
            <option value="">无父项目</option>
            {parentCandidates.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
          />
          <input
            type="date"
            value={newEnd}
            min={newStart}
            onChange={(e) => setNewEnd(e.target.value)}
            className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
          />
          <input
            type="number"
            value={newTarget}
            min={0}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="目标"
            className="w-16 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 placeholder-gray-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!newName.trim() || !newEnd}
            className="flex-shrink-0 rounded-md bg-indigo-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            添加
          </button>
        </form>
      )}

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
          {/* ===== 左列：列表（固定） ===== */}
          <div className="w-56 flex-shrink-0 border-r border-gray-200">
            <div className={`flex items-center border-b border-gray-100 px-4 ${ROW_H}`}>
              <span className="text-xs text-gray-400">Aa 计划事项</span>
            </div>
            {flatList.map((p) => (
              <div key={p.id}
                className={`flex items-center gap-2 border-b border-gray-100 bg-white px-4 ${ROW_H} ${p.depth === 0 ? 'font-medium' : 'text-gray-500'}`}
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

          {/* ===== 右列：时间轴（统一滚动） ===== */}
          <div ref={ganttScrollRef} className="flex-1 overflow-x-auto
            [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-50">
            <div style={{ minWidth: ganttTotal * DAY_W }}>
              {/* 日期表头 */}
              <div className="border-b border-gray-100">
                <div className="flex">
                  {ganttMonthLabels.map((m, mi) => {
                    const prevCol = mi > 0 ? ganttMonthLabels[mi - 1].col : 0
                    return (
                      <div key={m.col} className="flex-shrink-0 py-1 text-[10px] font-medium text-gray-400"
                        style={{ marginLeft: (m.col - prevCol) * DAY_W }}>{m.label}</div>
                    )
                  })}
                </div>
                <div className="flex">
                  {ganttDays.map((d) => {
                    const dayNum = parseInt(d.slice(8, 10), 10)
                    const isStart = dragPreviewRange?.start === d
                    const isEnd = dragPreviewRange?.end === d
                    const isInRange = dragPreviewRange && d >= dragPreviewRange.start && d <= dragPreviewRange.end && d !== dragPreviewRange.start && d !== dragPreviewRange.end
                    return (
                      <div key={d}
                        className={`flex flex-shrink-0 items-center justify-center text-[10px] transition-colors
                          ${isStart ? 'bg-blue-50 text-blue-600 font-bold rounded-t-md' : ''}
                          ${isEnd ? 'bg-orange-50 text-orange-600 font-bold rounded-t-md' : ''}
                          ${isInRange ? 'bg-gray-50/80' : ''}
                          ${!isStart && !isEnd && !isInRange ? 'text-gray-400' : ''}`}
                        style={{ width: DAY_W, height: 24 }}>
                        {d === todayStr ? (
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${isStart || isEnd || isInRange ? 'bg-red-400' : 'bg-red-500'}`}>{dayNum}</span>
                        ) : dayNum}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 甘特条 */}
              <div className="relative">
                {ganttTodayPct >= 0 && (
                  <div className="pointer-events-none absolute top-0 z-10 w-px bg-red-400"
                    style={{ left: `${ganttTodayPct}%`, height: flatList.length * 48 }} />
                )}
                {/* 拖拽预览垂直辅助线 */}
                {dragPreviewRange && (
                  <>
                    {(() => {
                      const sIdx = ganttDays.indexOf(dragPreviewRange.start)
                      const eIdx = ganttDays.indexOf(dragPreviewRange.end)
                      return (
                        <>
                          {sIdx >= 0 && (
                            <div className="pointer-events-none absolute top-0 z-5" style={{ left: `${(sIdx / ganttTotal) * 100}%`, width: `${(1 / ganttTotal) * 100}%`, height: flatList.length * 48 }}>
                              <div className="h-full w-full border-x border-blue-300/40 bg-blue-50/20" />
                            </div>
                          )}
                          {eIdx >= 0 && (
                            <div className="pointer-events-none absolute top-0 z-5" style={{ left: `${(eIdx / ganttTotal) * 100}%`, width: `${(1 / ganttTotal) * 100}%`, height: flatList.length * 48 }}>
                              <div className="h-full w-full border-x border-orange-300/40 bg-orange-50/20" />
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </>
                )}
                {flatList.map((p) => (
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
  )
}
