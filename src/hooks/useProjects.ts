import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Project, ExecutionEntry } from '../types'
import { api } from '../api'

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
    try {
      const all = await api.getProjects()
      setProjects(all.map((p: Project) => ({ ...p, progress: 0 })))
    } catch (e) { console.error(e) }
  }, [])

  const loadExecutions = useCallback(async () => {
    try { setExecutions(await api.getExecutions()) } catch (e) { console.error(e) }
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
    const created = await api.addProject(project)
    setProjects((prev) => [...prev, { ...created, progress: 0, completionNote: '' }])
  }, [])

  const addExecution = useCallback(async (entry: Omit<ExecutionEntry, 'id'>) => {
    const created = await api.addExecution(entry)
    setExecutions((prev) => [...prev, created])
  }, [])

  const deleteExecution = useCallback(async (id: number) => {
    await api.deleteExecution(id)
    setExecutions((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const deleteProject = useCallback(async (id: number) => {
    await api.deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setExecutions((prev) => prev.filter((e) => e.parentId !== id && e.subProjectId !== id))
  }, [])

  const archiveProject = useCallback(async (id: number) => {
    const updated = await api.archiveProject(id)
    setProjects((prev) => prev.map((p) => p.id === id ? updated : p))
  }, [])

  const updateProject = useCallback(async (id: number, updates: Partial<Pick<Project, 'name' | 'target' | 'startDate' | 'endDate'>>) => {
    const updated = await api.updateProject(id, updates)
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...updated } : p))
  }, [])

  return { projects: projectsWithProgress, executions, addProject, addExecution, deleteProject, deleteExecution, archiveProject, updateProject }
}
