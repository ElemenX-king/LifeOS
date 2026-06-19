import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Project, ExecutionEntry } from '../types'
import { db } from '../db/db'

const MOCK_PROJECTS: Project[] = [
  { id: 1, name: '集创赛省赛', startDate: '2026-06-10', endDate: '2026-07-05', progress: 0, type: 'school', target: 100, completionNote: '' },
  { id: 2, name: '电路修改', parentId: 1, startDate: '2026-06-12', endDate: '2026-06-25', progress: 0, type: 'school', target: 30, completionNote: '' },
  { id: 3, name: '文档撰写', parentId: 1, startDate: '2026-06-20', endDate: '2026-07-03', progress: 0, type: 'school', target: 20, completionNote: '' },
  { id: 4, name: '9248芯片学习', startDate: '2026-06-15', endDate: '2026-07-10', progress: 0, type: 'company', target: 50, completionNote: '' },
  { id: 5, name: '完成仿真', parentId: 4, startDate: '2026-06-18', endDate: '2026-06-30', progress: 0, type: 'company', target: 20, completionNote: '' },
  { id: 6, name: '测试验证', parentId: 4, startDate: '2026-06-25', endDate: '2026-07-08', progress: 0, type: 'company', target: 10, completionNote: '' },
  { id: 7, name: '年度复盘', startDate: '2026-06-20', endDate: '2026-06-28', progress: 0, type: 'personal', target: 10, completionNote: '' },
]

// 动态计算子项目进度：sum(执行条目target) / 子项目target * 100
function calcSubProgress(executions: ExecutionEntry[], subTarget: number): number {
  if (!subTarget) return 0
  const done = executions.reduce((sum, e) => sum + e.target, 0)
  return Math.min(Math.round((done / subTarget) * 100), 100)
}

// 动态计算父项目进度：sum(所有子项目的执行条目target之和) / 父项目target * 100  
function calcParentProgress(allExecutions: ExecutionEntry[], parentId: number, parentTarget: number): number {
  if (!parentTarget) return 0
  const done = allExecutions.filter((e) => e.parentId === parentId).reduce((sum, e) => sum + e.target, 0)
  return Math.min(Math.round((done / parentTarget) * 100), 100)
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [executions, setExecutions] = useState<ExecutionEntry[]>([])

  const loadProjects = useCallback(async () => {
    const all = await db.projects.toArray()
    if (all.length === 0) {
      await db.projects.bulkAdd(MOCK_PROJECTS)
      setProjects(MOCK_PROJECTS)
    } else {
      // 重置存储的 progress 为 0，由 useMemo 动态计算
      setProjects(all.map((p) => ({ ...p, progress: 0 })))
    }
  }, [])

  const loadExecutions = useCallback(async () => {
    const all = await db.executions.toArray()
    setExecutions(all)
  }, [])

  useEffect(() => { loadProjects(); loadExecutions() }, [loadProjects, loadExecutions])

  // 动态计算进度：每次 projects 或 executions 变化时自动重算
  const projectsWithProgress = useMemo(() => {
    return projects.map((p) => {
      if (!p.parentId) {
        return { ...p, progress: calcParentProgress(executions, p.id!, p.target || 0) }
      } else {
        const subExecs = executions.filter((e) => e.subProjectId === p.id)
        return { ...p, progress: calcSubProgress(subExecs, p.target || 0) }
      }
    })
  }, [projects, executions])

  const addProject = useCallback(async (project: Omit<Project, 'id' | 'progress' | 'completionNote'>) => {
    const newProject: Project = { ...project, progress: 0, completionNote: '' }
    const id = await db.projects.add(newProject)
    setProjects((prev) => [...prev, { ...newProject, id }])
  }, [])

  const addExecution = useCallback(async (entry: Omit<ExecutionEntry, 'id'>) => {
    const id = await db.executions.add(entry)
    setExecutions((prev) => [...prev, { ...entry, id }])
  }, [])

  const deleteExecution = useCallback(async (id: number) => {
    await db.executions.delete(id)
    setExecutions((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const deleteProject = useCallback(async (id: number) => {
    // 删除该项目及所有子项目
    const subs = projects.filter((p) => p.parentId === id)
    const idsToDelete = [id, ...subs.map((s) => s.id!).filter(Boolean)]
    await db.projects.bulkDelete(idsToDelete)
    // 同时删除相关执行条目
    const execsToDelete = executions.filter((e) => e.parentId === id || subs.some((s) => s.id === e.subProjectId))
    if (execsToDelete.length > 0) {
      await db.executions.bulkDelete(execsToDelete.map((e) => e.id!).filter(Boolean))
      setExecutions((prev) => prev.filter((e) => !execsToDelete.some((d) => d.id === e.id)))
    }
    setProjects((prev) => prev.filter((p) => !idsToDelete.includes(p.id!)))
  }, [projects, executions])

  const archiveProject = useCallback(async (id: number) => {
    await db.projects.update(id, { isArchived: true })
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, isArchived: true } : p))
  }, [])

  const updateProject = useCallback(async (id: number, updates: Partial<Pick<Project, 'name' | 'target' | 'startDate' | 'endDate'>>) => {
    await db.projects.update(id, updates)
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p))
  }, [])

  return { projects: projectsWithProgress, executions, addProject, addExecution, deleteProject, deleteExecution, archiveProject, updateProject }
}
