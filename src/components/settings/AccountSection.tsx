import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SettingItem from './SettingItem'

export default function AccountSection() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { deleteAccount } = useSettingsStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount(user.id)
      navigate('/login')
    } catch (error) {
      console.error('刪除帳號失敗:', error)
      alert('刪除帳號失敗，請稍後再試')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <section className="bg-white rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-light text-foreground mb-6">
          帳號管理
        </h2>

        <div className="space-y-2">
          <SettingItem
            icon={<LogOut className="w-5 h-5" />}
            title="登出"
            description="登出您的帳號"
            onClick={handleSignOut}
          >
          </SettingItem>

          <SettingItem
            icon={<Trash2 className="w-5 h-5" />}
            title="刪除帳號"
            description="永久刪除您的帳號和所有資料"
            onClick={() => setShowDeleteConfirm(true)}
            danger
          >
          </SettingItem>
        </div>
      </section>

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-light text-foreground">
                確認刪除帳號
              </h3>
            </div>

            <p className="text-sm text-text-secondary mb-6">
              此操作將永久刪除您的帳號和所有相關資料，包括：
            </p>

            <ul className="text-sm text-text-secondary space-y-2 mb-6 ml-4">
              <li>• 個人資料和設定</li>
              <li>• 所有建立的行程</li>
              <li>• 分享和協作記錄</li>
              <li>• 費用記錄</li>
            </ul>

            <p className="text-sm text-red-500 font-medium mb-6">
              ⚠️ 此操作無法復原！
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-border rounded-xl text-foreground hover:bg-background-secondary transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}