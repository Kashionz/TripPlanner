import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Loader2,
  UserPlus,
  MessageSquare,
  MapPin,
  Settings,
  Trash2,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useCollaboration'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { Notification, NotificationType } from '@/types/collaboration'

// 通知類型圖示
const notificationIcons: Record<NotificationType, typeof Bell> = {
  invite_received: UserPlus,
  invite_accepted: UserPlus,
  member_joined: UserPlus,
  member_left: UserPlus,
  trip_updated: Settings,
  place_added: MapPin,
  place_removed: MapPin,
  comment_added: MessageSquare,
  comment_mentioned: MessageSquare,
  role_changed: Settings,
}

// 通知類型顏色
const notificationColors: Record<NotificationType, string> = {
  invite_received: 'text-primary bg-primary/10',
  invite_accepted: 'text-green-600 bg-green-50',
  member_joined: 'text-blue-600 bg-blue-50',
  member_left: 'text-orange-600 bg-orange-50',
  trip_updated: 'text-purple-600 bg-purple-50',
  place_added: 'text-teal-600 bg-teal-50',
  place_removed: 'text-red-600 bg-red-50',
  comment_added: 'text-indigo-600 bg-indigo-50',
  comment_mentioned: 'text-amber-600 bg-amber-50',
  role_changed: 'text-cyan-600 bg-cyan-50',
}

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    remove,
  } = useNotifications()

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 處理通知點擊
  const handleNotificationClick = async (notification: Notification) => {
    // 標記為已讀
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // 導航到相關頁面
    if (notification.data?.tripId) {
      setIsOpen(false)
      navigate(`/trip/${notification.data.tripId}`)
    }
  }

  // 刪除通知
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await remove(notificationId)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 觸發按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-background-secondary transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-lg border border-border overflow-hidden z-50 animate-japanese-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary">
            <h3 className="font-medium text-foreground">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                全部已讀
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
                <p className="text-foreground-muted">目前沒有通知</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={(e) => handleDelete(e, notification.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-background-secondary">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // navigate('/notifications') // 可以新增完整通知頁面
                }}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                查看所有通知
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 單一通知項目
interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Bell
  const colorClass = notificationColors[notification.type] || 'text-foreground-muted bg-background-secondary'

  const timeAgo = formatDistanceToNow(notification.createdAt.toDate(), {
    addSuffix: true,
    locale: zhTW,
  })

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-background-secondary ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      {/* 圖示 */}
      <div className={`p-2 rounded-full flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-foreground`}>
              {notification.title}
            </p>
            <p className="text-sm text-foreground-muted line-clamp-2 mt-0.5">
              {notification.message}
            </p>
            <p className="text-xs text-foreground-muted mt-1">{timeAgo}</p>
          </div>
          
          {/* 操作 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-background-tertiary text-foreground-muted hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 通知徽章元件（用於其他地方顯示未讀數）
export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null
  
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-accent text-white text-xs font-medium rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  )
}

// 通知列表頁面元件
export function NotificationList() {
  const navigate = useNavigate()
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    remove,
  } = useNotifications()

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    if (notification.data?.tripId) {
      navigate(`/trip/${notification.data.tripId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-foreground">通知</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-primary hover:underline flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            全部標為已讀
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Bell className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
          <p className="text-foreground-muted text-lg">目前沒有通知</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell
            const colorClass = notificationColors[notification.type] || 'text-foreground-muted bg-background-secondary'
            const timeAgo = formatDistanceToNow(notification.createdAt.toDate(), {
              addSuffix: true,
              locale: zhTW,
            })

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-background-secondary ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className={`p-3 rounded-full flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`${!notification.read ? 'font-medium' : ''} text-foreground`}>
                    {notification.title}
                  </p>
                  <p className="text-foreground-secondary mt-1">{notification.message}</p>
                  <p className="text-sm text-foreground-muted mt-2">{timeAgo}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                      className="p-2 rounded-lg hover:bg-background-tertiary text-foreground-muted"
                      title="標為已讀"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(notification.id)
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 text-foreground-muted hover:text-red-500"
                    title="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}