import { useUIStore } from '@/stores/uiStore'
import { ReactNode } from 'react'
import BottomNavigation from './BottomNavigation'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarOpen, sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside
          className={`
            hidden lg:block fixed left-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]
            bg-white border-r border-border
            transition-all duration-300 ease-out
            ${sidebarCollapsed ? 'w-16' : 'w-64'}
          `}
        >
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main
          className={`
            flex-1 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] mt-14 sm:mt-16
            transition-all duration-300 ease-out
            ${sidebarOpen && !sidebarCollapsed ? 'lg:ml-64' : 'lg:ml-16'}
          `}
        >
          {/* 手機版需要額外的底部 padding 來避免被底部導航欄遮擋 */}
          <div className="p-4 pb-20 sm:p-6 md:p-8 lg:p-12 lg:pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebarOverlay />

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  )
}

function MobileSidebarOverlay() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()

  if (!mobileMenuOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full w-72 bg-white z-50 lg:hidden
          transform transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-xl font-light text-primary">TripPlanner</span>
        </div>
        <Sidebar />
      </div>
    </>
  )
}