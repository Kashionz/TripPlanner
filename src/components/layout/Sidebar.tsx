import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Map, 
  Plus, 
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: '首頁', href: '/dashboard' },
  { icon: <Map className="w-5 h-5" />, label: '我的行程', href: '/dashboard' },
  { icon: <Calendar className="w-5 h-5" />, label: '日曆', href: '/calendar' },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()

  return (
    <div className="h-full flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* New Trip Button */}
        <Link
          to="/trip/new"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl',
            'bg-primary text-white',
            'hover:bg-primary-dark transition-colors',
            sidebarCollapsed && 'justify-center px-3'
          )}
        >
          <Plus className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">新增行程</span>}
        </Link>

        <div className="pt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-background-secondary text-primary'
                    : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground',
                  sidebarCollapsed && 'justify-center px-3'
                )}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {/* Settings */}
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl',
            'text-foreground-secondary hover:bg-background-secondary hover:text-foreground',
            'transition-colors duration-200',
            sidebarCollapsed && 'justify-center px-3'
          )}
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && <span>設定</span>}
        </Link>

        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'hidden lg:flex w-full items-center gap-3 px-4 py-3 rounded-xl mt-2',
            'text-foreground-muted hover:bg-background-secondary hover:text-foreground-secondary',
            'transition-colors duration-200',
            sidebarCollapsed && 'justify-center px-3'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>收合選單</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}