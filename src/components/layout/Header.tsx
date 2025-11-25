import { Link } from 'react-router-dom'
import { Menu, Moon, Sun, LogOut, User, MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import NotificationDropdown from '@/components/collaboration/NotificationDropdown'

export default function Header() {
  const { user, signOut } = useAuthStore()
  const { theme, toggleTheme, setMobileMenuOpen } = useUIStore()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-border z-30">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left: Logo & Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-background-secondary transition-colors"
            aria-label="開啟選單"
          >
            <Menu className="w-5 h-5 text-foreground-secondary" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-light text-foreground hidden sm:block">
              TripPlanner
            </span>
          </Link>
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            首頁
          </Link>
          <Link
            to="/dashboard"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            我的行程
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
            aria-label={theme === 'light' ? '切換深色模式' : '切換淺色模式'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-foreground-secondary" />
            ) : (
              <Sun className="w-5 h-5 text-foreground-secondary" />
            )}
          </button>

          {/* Notifications (only for logged in users) */}
          {user && <NotificationDropdown />}

          {/* User Menu */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-secondary transition-colors">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="hidden md:block text-sm text-foreground">
                  {user.displayName}
                </span>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-border shadow-japanese-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-2">
                  <div className="px-3 py-2 text-sm text-foreground-muted truncate" title={user.email}>
                    {user.email}
                  </div>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-secondary hover:bg-background-secondary rounded-lg transition-colors"
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
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              登入
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}