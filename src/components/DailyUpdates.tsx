import { useState, useRef, useEffect } from 'react'
import { PenLine, Check, Target } from 'lucide-react'
import { useJournal } from '../hooks/useJournal'
import { useTodos } from '../hooks/useTodos'
import { useProjects } from '../hooks/useProjects'

const todayStr = new Date().toISOString().slice(0, 10)

export function DailyUpdates() {
  const { content, loading, saveNote } = useJournal()
  const { todos } = useTodos()
  const { projects } = useProjects()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(content) }, [content])

  const startEdit = () => {
    setDraft(content)
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleSave = async () => {
    await saveNote(draft)
    setIsEditing(false)
  }

  const todayTodos = todos.filter((t) => t.date === todayStr && !t.completed)
  const activeProjects = projects.filter(
    (p) => p.startDate <= todayStr && p.endDate >= todayStr,
  )

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      {/* 标题 */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold leading-tight text-gray-800">Daily Updates</h2>
          <p className="font-serif text-xl text-gray-500">每日总览</p>
        </div>
        <button
          onClick={isEditing ? handleSave : startEdit}
          className="mt-1 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          {isEditing ? <Check className="h-4 w-4 text-emerald-500" /> : <PenLine className="h-4 w-4" />}
        </button>
      </div>

      {/* 日志编辑区 */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="写下给明天的忠告..."
          className="w-full min-h-[80px] rounded-md bg-gray-50 p-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-1 focus:ring-indigo-100"
        />
      ) : (
        <p className="min-h-[32px] rounded-md bg-gray-50/50 px-2 py-2 text-sm text-gray-600">
          {loading ? (
            <span className="italic text-gray-300">加载中...</span>
          ) : content ? (
            content
          ) : (
            <span className="italic text-gray-400">写给明天的忠告...</span>
          )}
        </p>
      )}

      {/* 日程/项目简报 */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-amber-50/70 px-3 py-2">
          <span className="text-[10px] font-medium text-amber-600">日程</span>
          <p className="mt-0.5 text-xs text-gray-600">
            {todayTodos.length > 0 ? `今日 ${todayTodos.length} 项待办` : '今日暂无待办'}
          </p>
        </div>
        <div className="rounded-md bg-rose-50/70 px-3 py-2">
          <span className="text-[10px] font-medium text-rose-600">项目</span>
          <p className="mt-0.5 text-xs text-gray-600">
            {projects.length > 0 ? `${projects.length} 个项目` : '暂无项目'}
          </p>
        </div>
      </div>

      {/* 今日活跃项目 */}
      <div className="mt-4 rounded-lg bg-purple-50 p-3">
        <h3 className="mb-2 text-xs font-bold text-purple-600">今日活跃项目</h3>
        {activeProjects.length === 0 ? (
          <p className="text-xs text-gray-400">今日暂无活跃项目</p>
        ) : (
          <div className="space-y-1">
            {activeProjects
              .sort((a, b) => {
                const aParent = a.parentId ? 1 : 0
                const bParent = b.parentId ? 1 : 0
                if (aParent !== bParent) return aParent - bParent
                return a.startDate.localeCompare(b.startDate)
              })
              .map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 ${p.parentId ? 'ml-5' : ''}`}
                >
                  {p.parentId ? (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-300" />
                  ) : (
                    <Target className="h-3 w-3 flex-shrink-0 text-purple-500" />
                  )}
                  <span className={`text-sm ${p.parentId ? 'text-gray-500' : 'font-medium text-gray-700'}`}>
                    {p.name}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
