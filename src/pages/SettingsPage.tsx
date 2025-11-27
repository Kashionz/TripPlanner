import {
  AccountSection,
  NotificationSection,
  ProfileSection,
} from '@/components/settings'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { settings, loading, error } = useSettingsStore()

  // 注意：設定訂閱已移至 App.tsx 全域處理，這裡不需要重複訂閱

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">請先登入</p>
      </div>
    )
  }

  if (loading && !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">載入設定中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-light text-foreground">設定</h1>
          </div>
          <p className="text-text-secondary">
            管理您的帳號和應用程式偏好設定
          </p>
        </div>

        {/* 設定區塊 */}
        <div className="space-y-6">
          {/* 個人資料 */}
          <ProfileSection />

          {/* 通知設定 */}
          <NotificationSection />

          {/* 資料與帳號 */}
          <AccountSection />
        </div>

        {/* 版本資訊 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary">
            TripPlanner v1.0.0
          </p>
          <p className="text-xs text-text-secondary mt-1">
            © 2024 TripPlanner. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}