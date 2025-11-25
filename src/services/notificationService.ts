import {
  getNotificationPermission,
  requestNotificationPermission,
  subscribePush,
  unsubscribePush,
} from './pwaService'

/**
 * 通知服務
 * 管理推播通知和瀏覽器通知
 */

export type NotificationType = 
  | 'trip_invite'      // 行程邀請
  | 'trip_update'      // 行程更新
  | 'comment'          // 新留言
  | 'expense_add'      // 新增費用
  | 'reminder'         // 提醒

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
}

/**
 * 檢查通知權限狀態
 */
export function checkNotificationPermission(): NotificationPermission {
  return getNotificationPermission()
}

/**
 * 請求通知權限
 */
export async function requestPermission(): Promise<boolean> {
  const permission = await requestNotificationPermission()
  return permission === 'granted'
}

/**
 * 顯示本地通知
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('[Notification] 瀏覽器不支援通知')
    return
  }

  const permission = getNotificationPermission()
  
  if (permission === 'denied') {
    console.warn('[Notification] 通知權限被拒絕')
    return
  }

  if (permission === 'default') {
    const granted = await requestPermission()
    if (!granted) {
      return
    }
  }

  try {
    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...(typeof navigator !== 'undefined' && 'vibrate' in navigator && {
        vibrate: [200, 100, 200] as any,
      }),
      ...options,
    })

    // 點擊通知時的處理
    notification.onclick = (event) => {
      event.preventDefault()
      window.focus()
      notification.close()
      
      // 處理自訂資料
      if (options?.data?.url) {
        window.location.href = options.data.url
      }
    }
  } catch (error) {
    console.error('[Notification] 顯示通知失敗:', error)
  }
}

/**
 * 訂閱推播通知
 */
export async function subscribePushNotifications(
  _userId: string
): Promise<boolean> {
  try {
    // 檢查權限
    const hasPermission = await requestPermission()
    if (!hasPermission) {
      return false
    }

    // VAPID 公鑰（需要從環境變數取得）
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    
    if (!vapidPublicKey) {
      console.warn('[Notification] VAPID 公鑰未設定')
      return false
    }

    // 訂閱推播
    const subscription = await subscribePush(vapidPublicKey)
    
    if (!subscription) {
      return false
    }

    // 將訂閱資訊儲存到伺服器
    // TODO: 實作將 subscription 儲存到 Firestore
    console.log('[Notification] 推播訂閱成功:', subscription)
    
    return true
  } catch (error) {
    console.error('[Notification] 訂閱推播失敗:', error)
    return false
  }
}

/**
 * 取消訂閱推播通知
 */
export async function unsubscribePushNotifications(): Promise<boolean> {
  try {
    const result = await unsubscribePush()
    console.log('[Notification] 取消推播訂閱:', result)
    return result
  } catch (error) {
    console.error('[Notification] 取消訂閱失敗:', error)
    return false
  }
}

/**
 * 發送行程邀請通知
 */
export async function sendTripInviteNotification(
  tripTitle: string,
  inviterName: string
): Promise<void> {
  await showLocalNotification(
    '新的行程邀請',
    {
      body: `${inviterName} 邀請您加入「${tripTitle}」`,
      tag: 'trip-invite',
      data: {
        type: 'trip_invite',
        url: '/dashboard',
      },
    }
  )
}

/**
 * 發送行程更新通知
 */
export async function sendTripUpdateNotification(
  tripTitle: string,
  updateType: string
): Promise<void> {
  await showLocalNotification(
    '行程已更新',
    {
      body: `「${tripTitle}」${updateType}`,
      tag: 'trip-update',
      data: {
        type: 'trip_update',
      },
    }
  )
}

/**
 * 發送新留言通知
 */
export async function sendCommentNotification(
  tripTitle: string,
  commenterName: string,
  comment: string
): Promise<void> {
  await showLocalNotification(
    '新留言',
    {
      body: `${commenterName} 在「${tripTitle}」留言：${comment}`,
      tag: 'comment',
      data: {
        type: 'comment',
      },
    }
  )
}

/**
 * 發送費用新增通知
 */
export async function sendExpenseNotification(
  tripTitle: string,
  expenseTitle: string,
  amount: number
): Promise<void> {
  await showLocalNotification(
    '新增費用',
    {
      body: `在「${tripTitle}」新增了「${expenseTitle}」費用 $${amount}`,
      tag: 'expense',
      data: {
        type: 'expense_add',
      },
    }
  )
}

/**
 * 發送行程提醒通知
 */
export async function sendTripReminderNotification(
  tripTitle: string,
  daysUntilTrip: number
): Promise<void> {
  const message = daysUntilTrip === 0
    ? '您的行程今天開始！'
    : `您的行程將在 ${daysUntilTrip} 天後開始`

  await showLocalNotification(
    '行程提醒',
    {
      body: `「${tripTitle}」${message}`,
      tag: 'reminder',
      requireInteraction: true,
      data: {
        type: 'reminder',
      },
    }
  )
}

/**
 * 批次通知（用於背景同步）
 */
export async function sendBatchNotifications(
  notifications: Array<{
    title: string
    options: NotificationOptions
  }>
): Promise<void> {
  for (const notification of notifications) {
    await showLocalNotification(notification.title, notification.options)
    // 避免同時顯示太多通知
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}