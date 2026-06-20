import { useState, useEffect, useCallback } from 'react'
import './index.css'
import { useTodos } from './hooks/useTodos'
import { useHabits } from './hooks/useHabits'
import { Banner } from './components/Banner'
import { ModuleCards } from './components/ModuleCards'
import { MiniCalendar } from './components/MiniCalendar'
import { DailyUpdates } from './components/DailyUpdates'
import { DailyHabits } from './components/DailyHabits'
import { ImportantReminder } from './components/ImportantReminder'
import { DataTable } from './components/DataTable'
import { MonthlyHeatmap } from './components/MonthlyHeatmap'
import { WeeklySchedule } from './components/WeeklySchedule'
import { ProjectOverview } from './components/ProjectOverview'
import { ProjectPage } from './components/ProjectPage'
import { SchedulePage } from './components/SchedulePage'
import type { Priority, HabitType, HabitRecord } from './types'

function App() {
  const { todos, loading, addTodo, toggleTodo, updateTodo, deleteTodo, importantTodos, importantLoading, addImportantTodo, deleteImportantTodo } = useTodos()
  const { habits, todayRecords, loading: habitsLoading, addHabit, updateHabit, toggleHabitStatus, deleteHabit, getMonthRecords } = useHabits()
  const [monthRecords, setMonthRecords] = useState<HabitRecord[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const loadMonthRecords = useCallback(async () => {
    const now = new Date()
    const records = await getMonthRecords(now.getFullYear(), now.getMonth())
    setMonthRecords(records)
  }, [getMonthRecords])

  useEffect(() => { loadMonthRecords() }, [loadMonthRecords, todayRecords])

  const handleAddTodo = (title: string, priority: Priority, date: string) => { addTodo(title, priority, date) }
  const handleAddHabit = async (name: string, type: HabitType) => { await addHabit(name, type) }

  const handleModuleClick = (moduleId: string) => {
    setActiveModule((prev) => (prev === moduleId ? null : moduleId))
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f9fb]">
      <main className="mx-auto max-w-[1440px] px-6 pb-12">
        <Banner />
        <div className="w-full">
          <ModuleCards activeModule={activeModule} onModuleClick={handleModuleClick} />

          {activeModule === null ? (
            /* ===== 主页仪表盘 ===== */
            <div className="dashboard-grid">
              <aside className="dashboard-left">
                <MiniCalendar importantTodos={importantTodos} />
                <DailyUpdates />
                <DailyHabits habits={habits} todayRecords={todayRecords} loading={habitsLoading} onToggle={toggleHabitStatus} onUpdate={updateHabit} onDelete={deleteHabit} />
              </aside>

              <section className="dashboard-right">
                <DataTable todos={todos} loading={loading} onToggle={toggleTodo} onUpdate={updateTodo} onDelete={deleteTodo} onAdd={handleAddTodo} />
                <MonthlyHeatmap habits={habits} monthRecords={monthRecords} onAddHabit={handleAddHabit} />
                <ProjectOverview />
                <ImportantReminder todos={importantTodos} loading={importantLoading} onAdd={addImportantTodo} onDelete={deleteImportantTodo} />
                <WeeklySchedule onToggle={toggleTodo} />
              </section>
            </div>
          ) : activeModule === 'project' ? (
            /* ===== 项目管理页面 ===== */
            <ProjectPage />
          ) : activeModule === 'schedule' ? (
            /* ===== 日程管理页面 ===== */
            <SchedulePage />
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default App
