import {
  checkNotificationPermission,
  requestPermission,
  subscribePushNotifications,
  unsubscribePushNotifications,
} from '@/services/notificationService'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { AlertCircle, Bell, Mail, MessageSquare, RefreshCw, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import SettingItem from './SettingItem'

export default function NotificationSection() {
  const { user } = useAuthStore()
  const { settings, updateSettings } = useSettingsStore()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [requestingPermission, setRequestingPermission] = useState(false)

  useEffect(() => {
    setNotificationPermission(checkNotificationPermission())
  }, [])

  if (!user || !settings) return null

  const handleToggle = async (key: keyof typeof settings.notifications) => {
    try {
      const newValue = !settings.notifications[key]
      
      // 如果要開啟推播通知，先請求權限
      if (key === 'push' && newValue) {
        const hasPermission = await handleRequestPermission()
        if (!hasPermission) {
          return
        }
      }
      
      await updateSettings(user.id, {
        notifications: {
          ...settings.notifications,
          [key]: newValue,
        },
      })

      // 訂閱或取消訂閱推播
      if (key === 'push') {
        if (newValue) {
          await subscribePushNotifications(user.id)
        } else {
          await unsubscribePushNotifications()
        }
      }
    } catch (error) {
      console.error('更新通知設定失敗:', error)
    }
  }

  const handleRequestPermission = async (): Promise<boolean> => {
    setRequestingPermission(true)
    try {
      const granted = await requestPermission()
      setNotificationPermission(checkNotificationPermission())
      return granted
    } finally {
      setRequestingPermission(false)
    }
  }

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-primary' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )

  return (
    <section className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-light text-foreground mb-6">
        通知設定
      </h2>

      {/* 權限提示 */}
      {notificationPermission === 'denied' && (
        <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground mb-1">通知權限已被拒絕</p>
            <p className="text-foreground-muted">
              請在瀏覽器設定中允許通知權限，才能接收推播通知。
            </p>
          </div>
        </div>
      )}

      {notificationPermission === 'default' && settings.notifications.push && (
        <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground mb-2">需要您的授權才能發送通知</p>
            <button
              onClick={handleRequestPermission}
              disabled={requestingPermission}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
            >
              {requestingPermission ? '請求中...' : '授權通知'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <SettingItem
          icon={<Mail className="w-5 h-5" />}
          title="電子郵件通知"
          description="接收重要更新和提醒的電子郵件"
        >
          <ToggleSwitch
            enabled={settings.notifications.email}
            onChange={() => handleToggle('email')}
          />
        </SettingItem>

        <SettingItem
          icon={<Bell className="w-5 h-5" />}
          title="推播通知"
          description={
            notificationPermission === 'granted'
              ? '在裝置上接收即時通知'
              : '需要授權才能接收推播通知'
          }
        >
          <ToggleSwitch
            enabled={settings.notifications.push && notificationPermission === 'granted'}
            onChange={() => handleToggle('push')}
          />
        </SettingItem>

        <SettingItem
          icon={<MessageSquare className="w-5 h-5" />}
          title="留言通知"
          description="當有人在你的行程留言時通知你"
        >
          <ToggleSwitch
            enabled={settings.notifications.comments}
            onChange={() => handleToggle('comments')}
          />
        </SettingItem>

        <SettingItem
          icon={<UserPlus className="w-5 h-5" />}
          title="協作邀請通知"
          description="當有人邀請你加入行程時通知你"
        >
          <ToggleSwitch
            enabled={settings.notifications.invitations}
            onChange={() => handleToggle('invitations')}
          />
        </SettingItem>

        <SettingItem
          icon={<RefreshCw className="w-5 h-5" />}
          title="行程更新通知"
          description="當參與的行程有更新時通知你"
        >
          <ToggleSwitch
            enabled={settings.notifications.tripUpdates}
            onChange={() => handleToggle('tripUpdates')}
          />
        </SettingItem>
      </div>
    </section>
  )
}