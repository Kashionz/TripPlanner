import NotificationDropdown from '@/components/collaboration/NotificationDropdown'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { LogOut, MapPin, Menu, User } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Header() {
  const { user, signOut } = useAuthStore()
  const { setMobileMenuOpen } = useUIStore()

  return (
    <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-border z-30 safe-top">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        {/* Left: Logo & Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Button - 增大觸控區域 */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden touch-target p-2 rounded-lg hover:bg-background-secondary transition-colors"
            aria-label="開啟選單"
          >
            <Menu className="w-5 h-5 text-foreground-secondary" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-light text-foreground hidden sm:block">
              TripPlanner
            </span>
          </Link>
        </div>


        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications (only for logged in users) */}
          {user && <NotificationDropdown />}

          {/* User Menu */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 touch-target p-2 rounded-lg hover:bg-background-secondary transition-colors">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
                <span className="hidden md:block text-sm text-foreground">
                  {user.displayName}
                </span>
              </button>

              {/* Dropdown - 手機版從底部彈出 */}
              <div className="absolute right-0 top-full mt-1 w-48 sm:w-56 bg-white rounded-xl border border-border shadow-japanese-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                lg:rounded-xl
                max-lg:fixed max-lg:left-4 max-lg:right-4 max-lg:top-auto max-lg:bottom-20 max-lg:w-auto max-lg:rounded-2xl">
                <div className="p-2">
                  <div className="px-3 py-2 text-sm text-foreground-muted truncate" title={user.email}>
                    {user.email}
                  </div>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground-secondary hover:bg-background-secondary rounded-lg transition-colors touch-target"
                  >
                    <LogOut className="w-4 h-4" />
                    登出
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="touch-target px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              登入
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}