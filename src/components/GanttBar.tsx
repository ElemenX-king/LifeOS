import { useState, useRef, useCallback, useEffect } from 'react'
import type { Project } from '../types'

interface GanttBarProps {
  project: Project
  cellWidth: number
  days: string[]
  totalDays: number
  barColor: string
  rowHeight: string
  onUpdate: (id: number, startDate: string, endDate: string) => void
  onDragPreview?: (range: { start: string; end: string } | null) => void
}

type DragMode = 'move' | 'resize-left' | 'resize-right' | null

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function dateDiffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((da.getTime() - db.getTime()) / 86400000)
}

export function GanttBar({ project, cellWidth, days, totalDays, barColor, rowHeight, onUpdate, onDragPreview }: GanttBarProps) {
  const startIdx = days.indexOf(project.startDate)
  const endIdx = days.indexOf(project.endDate)

  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [previewOffset, setPreviewOffset] = useState(0)

  const dragStartX = useRef(0)
  const dragStartLeft = useRef(0)
  const dragStartWidth = useRef(0)
  const dragStartStartDate = useRef('')
  const dragStartEndDate = useRef('')

  const barRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault()
    e.stopPropagation()

    setDragMode(mode)
    setPreviewOffset(0)
    dragStartX.current = e.clientX

    const bar = barRef.current
    if (bar) {
      dragStartLeft.current = bar.offsetLeft
      dragStartWidth.current = bar.offsetWidth
    }
    dragStartStartDate.current = project.startDate
    dragStartEndDate.current = project.endDate

    document.body.style.userSelect = 'none'
    document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ew-resize'
  }, [project])

  useEffect(() => {
    if (!dragMode) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaPx = e.clientX - dragStartX.current
      const deltaDays = Math.round(deltaPx / cellWidth)
      let newStart = dragStartStartDate.current
      let newEnd = dragStartEndDate.current

      if (dragMode === 'move') {
        newStart = addDays(dragStartStartDate.current, deltaDays)
        newEnd = addDays(dragStartEndDate.current, deltaDays)
        const newStartIdx = days.indexOf(newStart)
        if (newStartIdx >= 0) {
          setPreviewOffset(deltaPx)
          onDragPreview?.({ start: newStart, end: newEnd })
        }
      } else if (dragMode === 'resize-left') {
        newStart = addDays(dragStartStartDate.current, deltaDays)
        if (newStart <= dragStartEndDate.current) {
          const newStartIdx = days.indexOf(newStart)
          if (newStartIdx >= 0) {
            setPreviewOffset(deltaPx)
            onDragPreview?.({ start: newStart, end: dragStartEndDate.current })
          }
        }
      } else if (dragMode === 'resize-right') {
        newEnd = addDays(dragStartEndDate.current, deltaDays)
        if (newEnd >= dragStartStartDate.current) {
          const newEndIdx = days.indexOf(newEnd)
          if (newEndIdx >= 0) {
            setPreviewOffset(deltaPx)
            onDragPreview?.({ start: dragStartStartDate.current, end: newEnd })
          }
        }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const deltaPx = e.clientX - dragStartX.current
      const deltaDays = Math.round(deltaPx / cellWidth)

      if (deltaDays !== 0 && dragMode) {
        if (dragMode === 'move') {
          const newStart = addDays(dragStartStartDate.current, deltaDays)
          const newEnd = addDays(dragStartEndDate.current, deltaDays)
          onUpdate(project.id!, newStart, newEnd)
        } else if (dragMode === 'resize-left') {
          const newStart = addDays(dragStartStartDate.current, deltaDays)
          if (newStart <= dragStartEndDate.current) {
            onUpdate(project.id!, newStart, dragStartEndDate.current)
          }
        } else if (dragMode === 'resize-right') {
          const newEnd = addDays(dragStartEndDate.current, deltaDays)
          if (newEnd >= dragStartStartDate.current) {
            onUpdate(project.id!, dragStartStartDate.current, newEnd)
          }
        }
      }

      setDragMode(null)
      setPreviewOffset(0)
      onDragPreview?.(null)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode, cellWidth, days, project, onUpdate])

  // 计算条带实际位置
  const s = startIdx === -1 ? 0 : startIdx
  const e = endIdx === -1 ? totalDays - 1 : endIdx
  const baseLeft = (s / totalDays) * 100
  const baseWidth = ((e - s + 1) / totalDays) * 100

  // 预览偏移（仅拖拽中生效）
  let styleLeftPct = baseLeft
  let styleWidthPct = baseWidth
  if (dragMode && previewOffset !== 0) {
    const deltaPct = (previewOffset / (totalDays * cellWidth)) * 100
    if (dragMode === 'move') {
      styleLeftPct = baseLeft + deltaPct
    } else if (dragMode === 'resize-left') {
      styleLeftPct = baseLeft + deltaPct
      styleWidthPct = baseWidth - deltaPct
    } else if (dragMode === 'resize-right') {
      styleWidthPct = baseWidth + deltaPct
    }
  }

  const mode = dragMode || null

  return (
    <div
      ref={barRef}
      className={`absolute top-2 rounded-md ${barColor} flex items-center gap-2 px-2 select-none`}
      style={{
        left: `${styleLeftPct}%`,
        width: `${Math.max(styleWidthPct, 0.5)}%`,
        height: 32,
        minWidth: 40,
        cursor: mode === 'move' ? 'grabbing' : mode ? 'ew-resize' : 'grab',
        zIndex: mode ? 20 : 10,
        transition: mode ? 'none' : 'left 0.15s ease, width 0.15s ease',
      }}
    >
      {/* 左边缘拖拽热区 */}
      <div
        className="absolute left-0 top-0 h-full w-[6px] cursor-ew-resize rounded-l-md"
        style={{ background: 'transparent' }}
        onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
      />

      {/* 主体拖拽热区 */}
      <div
        className="absolute left-[6px] right-[6px] top-0 h-full cursor-grab"
        style={{ cursor: mode === 'move' ? 'grabbing' : 'grab', background: 'transparent' }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      />

      {/* 右边缘拖拽热区 */}
      <div
        className="absolute right-0 top-0 h-full w-[6px] cursor-ew-resize rounded-r-md"
        style={{ background: 'transparent' }}
        onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
      />

      {/* 条带文字（不可拖拽，pointer-events-none） */}
      <span className="truncate text-xs font-medium pointer-events-none relative z-10">{project.name}</span>
      <span className="flex-shrink-0 text-[10px] font-medium opacity-60 pointer-events-none relative z-10">{project.progress}%</span>
    </div>
  )
}
