import { getUserSettings } from './settingsService'
import { createNotification as createFirestoreNotification } from './collaborationService'
import { showLocalNotification } from './notificationService'
import type { NotificationType as CollaborationNotificationType, CreateNotificationData } from '@/types/collaboration'

/**
 * 通知過濾服務
 * 根據使用者的通知設定決定是否發送通知
 */

/**
 * 通知類型與設定鍵的對應關係
 */
const NOTIFICATION_TYPE_MAPPING: Record<CollaborationNotificationType, 'comments' | 'invitations' | 'tripUpdates'> = {
  // 留言相關
  'comment_added': 'comments',
  'comment_mentioned': 'comments',
  
  // 邀請相關
  'invite_received': 'invitations',
  'invite_accepted': 'invitations',
  'member_joined': 'invitations',
  
  // 行程更新相關
  'trip_updated': 'tripUpdates',
  'place_added': 'tripUpdates',
  'place_removed': 'tripUpdates',
  'role_changed': 'tripUpdates',
  'member_left': 'tripUpdates',
}

/**
 * 檢查是否應該發送特定類型的通知
 * @param userId 接收通知的使用者 ID
 * @param notificationType 通知類型
 * @returns { firestore: boolean, push: boolean } 是否應該發送 Firestore 通知和推播通知
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: CollaborationNotificationType
): Promise<{ firestore: boolean; push: boolean }> {
  try {
    // 取得使用者設定
    const settings = await getUserSettings(userId)
    
    if (!settings) {
      // 若無法取得設定，預設允許所有通知（保守策略）
      return { firestore: true, push: true }
    }

    // 取得對應的設定鍵
    const settingKey = NOTIFICATION_TYPE_MAPPING[notificationType]
    
    if (!settingKey) {
      // 未知的通知類型，預設允許
      return { firestore: true, push: true }
    }

    // 檢查該類型通知是否啟用
    const isTypeEnabled = settings.notifications[settingKey]
    
    // 檢查推播通知是否啟用
    const isPushEnabled = settings.notifications.push

    return {
      firestore: isTypeEnabled,  // Firestore 通知根據具體類型設定
      push: isTypeEnabled && isPushEnabled,  // 推播需要兩個都啟用
    }
  } catch (error) {
    // 錯誤時預設允許通知
    return { firestore: true, push: true }
  }
}

/**
 * 發送整合通知（Firestore + 推播）
 * 根據使用者設定決定是否發送
 * 
 * @param data Firestore 通知資料
 * @param pushOptions 推播通知選項（可選）
 */
export async function sendIntegratedNotification(
  data: CreateNotificationData,
  pushOptions?: {
    title: string
    body: string
    tag?: string
    requireInteraction?: boolean
    url?: string
  }
): Promise<void> {
  try {
    // 檢查是否應該發送通知
    const { firestore, push } = await shouldSendNotification(data.userId, data.type)

    // 發送 Firestore 通知
    if (firestore) {
      await createFirestoreNotification(data)
    }

    // 發送推播通知
    if (push && pushOptions) {
      await showLocalNotification(pushOptions.title, {
        body: pushOptions.body,
        tag: pushOptions.tag,
        requireInteraction: pushOptions.requireInteraction,
        data: {
          ...data.data,
          url: pushOptions.url,
        },
      })
    }
  } catch (error) {
    // 通知發送失敗不應影響主要功能
  }
}

/**
 * 批次發送整合通知
 * 用於需要發送給多個使用者的場景
 * 
 * @param notifications 通知陣列
 */
export async function sendBatchIntegratedNotifications(
  notifications: Array<{
    data: CreateNotificationData
    pushOptions?: {
      title: string
      body: string
      tag?: string
      requireInteraction?: boolean
      url?: string
    }
  }>
): Promise<void> {
  for (const notification of notifications) {
    await sendIntegratedNotification(notification.data, notification.pushOptions)
    // 避免同時發送太多通知，稍微延遲
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * 便捷函數：發送留言通知
 */
export async function sendCommentNotification(
  userId: string,
  tripId: string,
  tripTitle: string,
  commenterName: string,
  comment: string
): Promise<void> {
  await sendIntegratedNotification(
    {
      userId,
      type: 'comment_added',
      title: '新留言',
      message: `${commenterName} 在「${tripTitle}」留言`,
      data: {
        tripId,
        tripTitle,
        senderName: commenterName,
      },
    },
    {
      title: '新留言',
      body: `${commenterName} 在「${tripTitle}」留言：${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`,
      tag: 'comment',
      url: `/trip/${tripId}`,
    }
  )
}

/**
 * 便捷函數：發送提及通知
 */
export async function sendMentionNotification(
  userId: string,
  tripId: string,
  tripTitle: string,
  mentionerName: string
): Promise<void> {
  await sendIntegratedNotification(
    {
      userId,
      type: 'comment_mentioned',
      title: '有人提及您',
      message: `${mentionerName} 在「${tripTitle}」中提及了您`,
      data: {
        tripId,
        tripTitle,
        senderName: mentionerName,
      },
    },
    {
      title: '有人提及您',
      body: `${mentionerName} 在「${tripTitle}」中提及了您`,
      tag: 'mention',
      requireInteraction: true,
      url: `/trip/${tripId}`,
    }
  )
}

/**
 * 便捷函數：發送邀請通知
 */
export async function sendInviteNotification(
  userId: string,
  inviteId: string,
  tripId: string,
  tripTitle: string,
  inviterName: string
): Promise<void> {
  await sendIntegratedNotification(
    {
      userId,
      type: 'invite_received',
      title: '新的行程邀請',
      message: `${inviterName} 邀請您加入「${tripTitle}」`,
      data: {
        inviteId,
        tripId,
        tripTitle,
        senderName: inviterName,
      },
    },
    {
      title: '新的行程邀請',
      body: `${inviterName} 邀請您加入「${tripTitle}」`,
      tag: 'invite',
      requireInteraction: true,
      url: '/dashboard',
    }
  )
}

/**
 * 便捷函數：發送成員加入通知
 */
export async function sendMemberJoinedNotification(
  userId: string,
  tripId: string,
  tripTitle: string,
  memberName: string
): Promise<void> {
  await sendIntegratedNotification(
    {
      userId,
      type: 'member_joined',
      title: '新成員加入',
      message: `${memberName} 已加入「${tripTitle}」`,
      data: {
        tripId,
        tripTitle,
        senderName: memberName,
      },
    },
    {
      title: '新成員加入',
      body: `${memberName} 已加入「${tripTitle}」`,
      tag: 'member-joined',
      url: `/trip/${tripId}`,
    }
  )
}

/**
 * 便捷函數：發送行程更新通知
 */
export async function sendTripUpdateNotification(
  userId: string,
  tripId: string,
  tripTitle: string,
  updateDescription: string
): Promise<void> {
  await sendIntegratedNotification(
    {
      userId,
      type: 'trip_updated',
      title: '行程已更新',
      message: `「${tripTitle}」${updateDescription}`,
      data: {
        tripId,
        tripTitle,
      },
    },
    {
      title: '行程已更新',
      body: `「${tripTitle}」${updateDescription}`,
      tag: 'trip-update',
      url: `/trip/${tripId}`,
    }
  )
}
