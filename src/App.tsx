import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

// Layout
import Layout from '@/components/layout/Layout'
import AuthLayout from '@/components/layout/AuthLayout'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TripDetailPage from '@/pages/TripDetailPage'
import TripEditPage from '@/pages/TripEditPage'
import ExpensePage from '@/pages/ExpensePage'
import InvitePage from '@/pages/InvitePage'
import NotFoundPage from '@/pages/NotFoundPage'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuthStore()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground-muted">載入中...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route (for login page - redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuthStore()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground-muted">載入中...</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const theme = useUIStore((state) => state.theme)

  // 初始化認證狀態監聽
  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [initialize])

  // 初始化主題
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Routes>
      {/* 公開路由 */}
      <Route path="/" element={<HomePage />} />
      
      {/* 登入路由 */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* 需要認證的路由 */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trip/new"
        element={
          <ProtectedRoute>
            <Layout>
              <TripEditPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trip/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <TripDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trip/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <TripEditPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trip/:id/expense"
        element={
          <ProtectedRoute>
            <Layout>
              <ExpensePage />
            </Layout>
          </ProtectedRoute>
        }
      />

    {/* 邀請頁面 - 半公開路由（需要登入才能接受，但可以查看邀請內容） */}
    <Route path="/invite/:token" element={<InvitePage />} />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App