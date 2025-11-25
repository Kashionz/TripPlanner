import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  // 邀請
  createInvite,
  getInviteByToken,
  acceptInvite,
  revokeInvite,
  deleteInvite,
  subscribeToTripInvites,
  getInviteLink,
  copyInviteLink,
  // 通知
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToUserNotifications,
  // 留言
  createComment,
  updateComment,
  deleteComment,
  subscribeToTripComments,
  // 活動
  subscribeToTripActivities,
  // 成員管理
  updateMemberRoleWithActivity,
  removeMemberWithActivity,
  leaveTrip,
} from '@/services/collaborationService'
import type { MemberRole } from '@/types/trip'
import type {
  Invite,
  CreateInviteData,
  Notification,
  CommentWithUser,
  Activity,
} from '@/types/collaboration'

// ==================== 邀請 Hook ====================

/**
 * 行程邀請管理 Hook
 */
export function useTripInvites(tripId: string | undefined) {
  const { user } = useAuthStore()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 訂閱邀請變更
  useEffect(() => {
    if (!tripId) {
      setInvites([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToTripInvites(tripId, (newInvites) => {
      setInvites(newInvites)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [tripId])

  // 建立邀請
  const create = useCallback(
    async (role: MemberRole, email?: string, tripTitle?: string) => {
      if (!tripId || !user) {
        throw new Error('請先登入')
      }

      try {
        const inviteData: CreateInviteData = {
          tripId,
          tripTitle: tripTitle || '行程',
          inviterId: user.id,
          inviterName: user.displayName,
          inviterPhotoURL: user.photoURL,
          role,
          email,
        }
        const invite = await createInvite(inviteData)
        return invite
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [tripId, user]
  )

  // 撤銷邀請
  const revoke = useCallback(async (inviteId: string) => {
    try {
      await revokeInvite(inviteId)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  // 刪除邀請
  const remove = useCallback(async (inviteId: string) => {
    try {
      await deleteInvite(inviteId)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  // 取得連結
  const getLink = useCallback((token: string) => {
    return getInviteLink(token)
  }, [])

  // 複製連結
  const copyLink = useCallback(async (token: string) => {
    return await copyInviteLink(token)
  }, [])

  return {
    invites,
    loading,
    error,
    create,
    revoke,
    remove,
    getLink,
    copyLink,
    pendingInvites: invites.filter(i => i.status === 'pending'),
  }
}

/**
 * 接受邀請 Hook
 */
export function useAcceptInvite() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<Invite | null>(null)

  // 取得邀請資訊
  const fetchInvite = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const inviteData = await getInviteByToken(token)
      setInvite(inviteData)
      return inviteData
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 接受邀請
  const accept = useCallback(async (inviteId: string) => {
    if (!user) {
      return { success: false, message: '請先登入' }
    }

    setLoading(true)
    setError(null)
    try {
      const result = await acceptInvite(inviteId, user.id)
      if (!result.success) {
        setError(result.message)
      }
      return result
    } catch (err: any) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    invite,
    loading,
    error,
    fetchInvite,
    accept,
  }
}

// ==================== 通知 Hook ====================

/**
 * 使用者通知 Hook
 */
export function useNotifications() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // 訂閱通知
  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToUserNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications)
      setUnreadCount(newNotifications.filter(n => !n.read).length)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.id])

  // 標記為已讀
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  // 標記全部已讀
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return
    try {
      await markAllNotificationsAsRead(user.id)
    } catch (err: any) {
      setError(err.message)
    }
  }, [user?.id])

  // 刪除通知
  const remove = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    remove,
  }
}

// ==================== 留言 Hook ====================

/**
 * 行程留言 Hook
 */
export function useTripComments(tripId: string | undefined) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 訂閱留言
  useEffect(() => {
    if (!tripId) {
      setComments([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToTripComments(tripId, (newComments) => {
      setComments(newComments)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [tripId])

  // 新增留言
  const add = useCallback(
    async (content: string, mentions?: string[], replyTo?: string) => {
      if (!tripId || !user) {
        throw new Error('請先登入')
      }

      setSubmitting(true)
      setError(null)
      try {
        await createComment({
          tripId,
          userId: user.id,
          content,
          mentions,
          replyTo,
        })
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [tripId, user]
  )

  // 更新留言
  const update = useCallback(
    async (commentId: string, content: string) => {
      if (!tripId) return

      try {
        await updateComment(tripId, commentId, content)
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [tripId]
  )

  // 刪除留言
  const remove = useCallback(
    async (commentId: string) => {
      if (!tripId) return

      try {
        await deleteComment(tripId, commentId)
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [tripId]
  )

  return {
    comments,
    loading,
    error,
    submitting,
    add,
    update,
    remove,
  }
}

// ==================== 活動記錄 Hook ====================

/**
 * 行程活動記錄 Hook
 */
export function useTripActivities(tripId: string | undefined) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // 訂閱活動記錄
  useEffect(() => {
    if (!tripId) {
      setActivities([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToTripActivities(tripId, (newActivities) => {
      setActivities(newActivities)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [tripId])

  return {
    activities,
    loading,
  }
}

// ==================== 成員管理 Hook ====================

/**
 * 成員管理操作 Hook
 */
export function useMemberActions(tripId: string | undefined) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 更新成員角色
  const updateRole = useCallback(
    async (memberId: string, userId: string, newRole: MemberRole) => {
      if (!tripId || !user) {
        throw new Error('請先登入')
      }

      setLoading(true)
      setError(null)
      try {
        await updateMemberRoleWithActivity(tripId, memberId, userId, newRole, {
          id: user.id,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [tripId, user]
  )

  // 移除成員
  const removeMember = useCallback(
    async (memberId: string, userId: string) => {
      if (!tripId || !user) {
        throw new Error('請先登入')
      }

      setLoading(true)
      setError(null)
      try {
        await removeMemberWithActivity(tripId, memberId, userId, {
          id: user.id,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [tripId, user]
  )

  // 離開行程
  const leave = useCallback(async () => {
    if (!tripId || !user) {
      throw new Error('請先登入')
    }

    setLoading(true)
    setError(null)
    try {
      await leaveTrip(tripId, {
        id: user.id,
        displayName: user.displayName,
        photoURL: user.photoURL,
      })
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tripId, user])

  return {
    loading,
    error,
    updateRole,
    removeMember,
    leave,
  }
}

// ==================== 組合 Hook ====================

/**
 * 完整協作功能 Hook
 */
export function useCollaboration(tripId: string | undefined) {
  const invites = useTripInvites(tripId)
  const comments = useTripComments(tripId)
  const activities = useTripActivities(tripId)
  const memberActions = useMemberActions(tripId)

  return {
    invites,
    comments,
    activities,
    memberActions,
  }
}