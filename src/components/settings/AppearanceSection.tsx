import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'

export default function AppearanceSection() {
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()

  if (!user || !settings) return null

  return (
    <section className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-light text-foreground mb-6">
        偏好設定
      </h2>

      {/* 目前沒有偏好設定項目 */}
      <p className="text-muted-foreground text-sm">暫無可用的偏好設定</p>
    </section>
  )
}