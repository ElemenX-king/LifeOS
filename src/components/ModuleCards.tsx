import {
  FolderKanban,
  CalendarRange,
  ShoppingCart,
  BookOpen,
  Target,
  type LucideIcon,
} from 'lucide-react'

// [改动] 精简数据结构：只保留 id / title / icon / color
interface ModuleCard {
  id: string
  title: string
  icon: LucideIcon
  color: string
}

const modules: ModuleCard[] = [
  { id: 'project', title: '项目管理', icon: FolderKanban, color: '#D97D48' },
  { id: 'schedule', title: '日程管理', icon: CalendarRange, color: '#D97D48' },
  { id: 'shopping', title: '物品购置', icon: ShoppingCart, color: '#D97D48' },
  { id: 'learn', title: '学习成长', icon: BookOpen, color: '#F2B33D' },
  { id: 'goals', title: '年度目标', icon: Target, color: '#A64833' },
]

interface ModuleCardsProps {
  activeModule: string | null
  onModuleClick: (id: string) => void
}

export function ModuleCards({ activeModule, onModuleClick }: ModuleCardsProps) {
  return (
    <div className="module-cards-grid animate-fade-in">
      {modules.map((mod) => {
        const Icon = mod.icon
        const isActive = activeModule === mod.id
        return (
          <button
            key={mod.id}
            onClick={() => onModuleClick(mod.id)}
            className={`module-card-simple group ${isActive ? 'module-card-active' : ''}`}
            style={{ '--card-accent': mod.color } as React.CSSProperties}
          >
            <div
              className="module-card-simple-icon"
              style={{ backgroundColor: `${mod.color}12`, color: mod.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="module-card-simple-title">{mod.title}</h3>
          </button>
        )
      })}
    </div>
  )
}

