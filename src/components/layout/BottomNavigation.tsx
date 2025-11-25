import { cn } from '@/lib/utils'
import { Calendar, Home, PlusCircle, Settings, Wallet } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  matchPaths?: string[]
}

const navItems: NavItem[] = [
  {
    icon: Home,
    label: '首頁',
    href: '/dashboard',
    matchPaths: ['/dashboard']
  },
  {
    icon: Calendar,
    label: '行程',
    href: '/dashboard',
    matchPaths: ['/trip']
  },
  {
    icon: PlusCircle,
    label: '新增',
    href: '/trip/new',
    matchPaths: ['/trip/new']
  },
  {
    icon: Wallet,
    label: '費用',
    href: '/dashboard',
    matchPaths: ['/expense']
  },
  {
    icon: Settings,
    label: '設定',
    href: '/dashboard',
    matchPaths: ['/settings']
  }
]

export default function BottomNavigation() {
  const location = useLocation()

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some(path => location.pathname.includes(path))
    }
    return location.pathname === item.href
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full touch-target',
                'transition-colors duration-200',
                active 
                  ? 'text-primary' 
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'w-6 h-6 mb-1',
                active && 'stroke-[2.5]'
              )} />
              <span className={cn(
                'text-xs',
                active ? 'font-medium' : 'font-normal'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}