import { Timestamp } from 'firebase/firestore'
import type { MemberRole } from './trip'

// ==================== 邀請連結 ====================

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

/**
 * 邀請連結
 */
export interface Invite {
  id: string
  tripId: string
  tripTitle: string
  inviterId: string
  inviterName: string
  inviterPhotoURL: string | null
  email: string | null           // 指定邀請對象的 email (可選)
  role: MemberRole               // 邀請角色
  token: string                  // 唯一邀請 token
  status: InviteStatus
  expiresAt: Timestamp           // 過期時間
  createdAt: Timestamp
  usedAt: Timestamp | null       // 使用時間
  usedBy: string | null          // 使用者 ID
}

/**
 * 建立邀請的資料
 */
export interface CreateInviteData {
  tripId: string
  tripTitle: string
  inviterId: string
  inviterName: string
  inviterPhotoURL: string | null
  email?: string
  role: MemberRole
  expiresInHours?: number        // 預設 72 小時
}

// ==================== 通知 ====================

export type NotificationType = 
  | 'invite_received'            // 收到邀請
  | 'invite_accepted'            // 邀請被接受
  | 'member_joined'              // 成員加入
  | 'member_left'                // 成員離開
  | 'trip_updated'               // 行程更新
  | 'place_added'                // 新增景點
  | 'place_removed'              // 移除景點
  | 'comment_added'              // 新增留言
  | 'comment_mentioned'          // 被提及
  | 'role_changed'               // 角色變更

/**
 * 通知
 */
export interface Notification {
  id: string
  userId: string                 // 接收者
  type: NotificationType
  title: string
  message: string
  data: NotificationData
  read: boolean
  createdAt: Timestamp
}

/**
 * 通知附加資料
 */
export interface NotificationData {
  tripId?: string
  tripTitle?: string
  inviteId?: string
  senderId?: string
  senderName?: string
  senderPhotoURL?: string | null
  placeId?: string
  placeName?: string
  commentId?: string
  newRole?: MemberRole
}

/**
 * 建立通知的資料
 */
export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
}

// ==================== 留言 ====================

/**
 * 留言（已在 trip.ts 定義，這裡擴展）
 */
export interface CommentWithUser {
  id: string
  tripId: string
  userId: string
  content: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  user: {
    displayName: string
    photoURL: string | null
    email: string
  }
  // 提及的使用者
  mentions?: string[]
  // 回覆的留言 ID
  replyTo?: string
}

/**
 * 建立留言的資料
 */
export interface CreateCommentData {
  tripId: string
  userId: string
  content: string
  mentions?: string[]
  replyTo?: string
}

// ==================== 活動記錄 ====================

export type ActivityType =
  | 'trip_created'               // 行程建立
  | 'trip_updated'               // 行程更新
  | 'member_invited'             // 邀請成員
  | 'member_joined'              // 成員加入
  | 'member_left'                // 成員離開
  | 'member_removed'             // 成員被移除
  | 'role_changed'               // 角色變更
  | 'day_added'                  // 新增天數
  | 'day_removed'                // 移除天數
  | 'place_added'                // 新增景點
  | 'place_updated'              // 更新景點
  | 'place_removed'              // 移除景點
  | 'place_reordered'            // 景點重新排序
  | 'comment_added'              // 新增留言

/**
 * 活動記錄
 */
export interface Activity {
  id: string
  tripId: string
  userId: string
  userName: string
  userPhotoURL: string | null
  type: ActivityType
  description: string
  metadata?: Record<string, any>
  createdAt: Timestamp
}

/**
 * 建立活動記錄的資料
 */
export interface CreateActivityData {
  tripId: string
  userId: string
  userName: string
  userPhotoURL: string | null
  type: ActivityType
  description: string
  metadata?: Record<string, any>
}

// ==================== 即時狀態 ====================

/**
 * 線上使用者狀態
 */
export interface OnlineUser {
  userId: string
  tripId: string
  displayName: string
  photoURL: string | null
  lastActive: Timestamp
  currentPage?: string           // 目前所在頁面
  isEditing?: boolean            // 是否正在編輯
  editingTarget?: string         // 正在編輯的項目 ID
}

/**
 * 協作游標位置（用於顯示其他使用者的操作）
 */
export interface CursorPosition {
  userId: string
  tripId: string
  dayId?: string
  placeId?: string
  timestamp: Timestamp
}

// ==================== 前端狀態 ====================

/**
 * 協作功能狀態
 */
export interface CollaborationState {
  // 邀請
  invites: Invite[]
  invitesLoading: boolean
  invitesError: string | null
  
  // 通知
  notifications: Notification[]
  notificationsLoading: boolean
  notificationsError: string | null
  unreadCount: number
  
  // 留言
  comments: CommentWithUser[]
  commentsLoading: boolean
  commentsError: string | null
  
  // 活動記錄
  activities: Activity[]
  activitiesLoading: boolean
  activitiesError: string | null
  
  // 線上狀態
  onlineUsers: OnlineUser[]
}