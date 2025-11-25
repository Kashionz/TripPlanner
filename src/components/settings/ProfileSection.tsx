import { useAuthStore } from '@/stores/authStore'
import { Camera, User } from 'lucide-react'
import { useState } from 'react'
import SettingItem from './SettingItem'

export default function ProfileSection() {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)

  if (!user) return null

  return (
    <section className="bg-white rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-light text-foreground mb-6">
        個人資料
      </h2>

      {/* 頭像 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-background-secondary flex items-center justify-center">
              <User className="w-10 h-10 text-text-secondary" />
            </div>
          )}
          <button
            className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            title="更換頭像"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-light text-foreground">
            {user.displayName}
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            {user.email}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <SettingItem
          icon={<User className="w-5 h-5" />}
          title="顯示名稱"
          description={user.displayName}
          onClick={() => setIsEditing(true)}
        >
          <span className="text-sm text-primary">編輯</span>
        </SettingItem>

        <SettingItem
          icon={<User className="w-5 h-5" />}
          title="電子郵件"
          description={user.email}
        />
      </div>

      {/* 編輯對話框 - 未來實作 */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-light text-foreground mb-4">
              編輯個人資料
            </h3>
            <p className="text-sm text-text-secondary">
              此功能尚未實作
            </p>
            <button
              onClick={() => setIsEditing(false)}
              className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </section>
  )
}