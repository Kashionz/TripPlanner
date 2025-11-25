import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

// Layout (不懶載入，因為是核心元件)
import Layout from '@/components/layout/Layout'
import AuthLayout from '@/components/layout/AuthLayout'

// 懶載入頁面
const HomePage = lazy(() => import('@/pages/HomePage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const TripDetailPage = lazy(() => import('@/pages/TripDetailPage'))
const TripEditPage = lazy(() => import('@/pages/TripEditPage'))
const ExpensePage = lazy(() => import('@/pages/ExpensePage'))
const InvitePage = lazy(() => import('@/pages/InvitePage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// PWA Components
import { InstallPrompt, UpdatePrompt, OfflineBanner } from '@/components/pwa'

// 載入中元件
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-foreground-muted text-sm">載入中...</p>
      </div>
    </div>
  )
}

// Suspense 包裝器
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

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
    <>
      {/* PWA 元件 */}
      <OfflineBanner />
      <InstallPrompt />
      <UpdatePrompt />
      
      <Routes>
        {/* 公開路由 */}
        <Route
          path="/"
          element={
            <SuspenseWrapper>
              <HomePage />
            </SuspenseWrapper>
          }
        />

        {/* 登入路由 */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <SuspenseWrapper>
                  <LoginPage />
                </SuspenseWrapper>
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
                <SuspenseWrapper>
                  <DashboardPage />
                </SuspenseWrapper>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trip/new"
          element={
            <ProtectedRoute>
              <Layout>
                <SuspenseWrapper>
                  <TripEditPage />
                </SuspenseWrapper>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trip/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <SuspenseWrapper>
                  <TripDetailPage />
                </SuspenseWrapper>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trip/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <SuspenseWrapper>
                  <TripEditPage />
                </SuspenseWrapper>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trip/:id/expense"
          element={
            <ProtectedRoute>
              <Layout>
                <SuspenseWrapper>
                  <ExpensePage />
                </SuspenseWrapper>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 邀請頁面 - 半公開路由 */}
        <Route
          path="/invite/:token"
          element={
            <SuspenseWrapper>
              <InvitePage />
            </SuspenseWrapper>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <SuspenseWrapper>
              <NotFoundPage />
            </SuspenseWrapper>
          }
        />
      </Routes>
    </>
  )
}

export default App