import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { addTripMember } from './tripService'
import type { MemberRole } from '@/types/trip'
import type {
  Invite,
  CreateInviteData,
  Notification,
  CreateNotificationData,
  CommentWithUser,
  CreateCommentData,
  Activity,
  CreateActivityData,
} from '@/types/collaboration'

// ==================== 邀請連結 ====================

const invitesCollection = collection(db, 'invites')

/**
 * 生成唯一的邀請 token
 */
function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * 建立邀請連結
 */
export async function createInvite(data: CreateInviteData): Promise<Invite> {
  const token = generateInviteToken()
  const expiresInHours = data.expiresInHours || 72
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiresInHours)

  const inviteData = {
    tripId: data.tripId,
    tripTitle: data.tripTitle,
    inviterId: data.inviterId,
    inviterName: data.inviterName,
    inviterPhotoURL: data.inviterPhotoURL,
    email: data.email || null,
    role: data.role,
    token,
    status: 'pending' as const,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp(),
    usedAt: null,
    usedBy: null,
  }

  const docRef = await addDoc(invitesCollection, inviteData)
  
  return {
    id: docRef.id,
    ...inviteData,
    createdAt: Timestamp.now(),
  } as Invite
}

/**
 * 透過 token 取得邀請
 */
export async function getInviteByToken(token: string): Promise<Invite | null> {
  const q = query(invitesCollection, where('token', '==', token))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
  } as Invite
}

/**
 * 取得行程的所有邀請
 */
export async function getTripInvites(tripId: string): Promise<Invite[]> {
  const q = query(
    invitesCollection,
    where('tripId', '==', tripId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Invite[]
}

/**
 * 接受邀請
 */
export async function acceptInvite(
  inviteId: string,
  userId: string
): Promise<{ success: boolean; message: string; tripId?: string }> {
  const inviteRef = doc(db, 'invites', inviteId)
  const inviteSnap = await getDoc(inviteRef)

  if (!inviteSnap.exists()) {
    return { success: false, message: '邀請不存在' }
  }

  const invite = inviteSnap.data() as Omit<Invite, 'id'>

  // 檢查邀請狀態
  if (invite.status !== 'pending') {
    return { success: false, message: '此邀請已被使用或已失效' }
  }

  // 檢查是否過期
  if (invite.expiresAt.toDate() < new Date()) {
    await updateDoc(inviteRef, { status: 'expired' })
    return { success: false, message: '此邀請已過期' }
  }

  // 檢查是否指定 email
  if (invite.email) {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      const userData = userSnap.data()
      if (userData.email !== invite.email) {
        return { success: false, message: '此邀請僅限特定使用者使用' }
      }
    }
  }

  // 檢查是否已是成員
  const membersQuery = query(
    collection(db, 'trips', invite.tripId, 'members'),
    where('userId', '==', userId)
  )
  const membersSnap = await getDocs(membersQuery)
  if (!membersSnap.empty) {
    return { success: false, message: '您已經是此行程的成員' }
  }

  // 加入行程
  await addTripMember(invite.tripId, userId, invite.role)

  // 更新邀請狀態
  await updateDoc(inviteRef, {
    status: 'accepted',
    usedAt: serverTimestamp(),
    usedBy: userId,
  })

  // 建立通知給邀請者
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const userName = userSnap.exists() ? userSnap.data().displayName : '使用者'
  
  await createNotification({
    userId: invite.inviterId,
    type: 'invite_accepted',
    title: '邀請已接受',
    message: `${userName} 已接受您的邀請，加入「${invite.tripTitle}」`,
    data: {
      tripId: invite.tripId,
      tripTitle: invite.tripTitle,
      senderId: userId,
      senderName: userName,
    },
  })

  return { success: true, message: '成功加入行程', tripId: invite.tripId }
}

/**
 * 撤銷邀請
 */
export async function revokeInvite(inviteId: string): Promise<void> {
  const inviteRef = doc(db, 'invites', inviteId)
  await updateDoc(inviteRef, { status: 'revoked' })
}

/**
 * 刪除邀請
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  const inviteRef = doc(db, 'invites', inviteId)
  await deleteDoc(inviteRef)
}

/**
 * 訂閱行程邀請變更
 */
export function subscribeToTripInvites(
  tripId: string,
  callback: (invites: Invite[]) => void
): () => void {
  const q = query(
    invitesCollection,
    where('tripId', '==', tripId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const invites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Invite[]
    callback(invites)
  })
}

// ==================== 通知 ====================

const notificationsCollection = collection(db, 'notifications')

/**
 * 建立通知
 */
export async function createNotification(
  data: CreateNotificationData
): Promise<string> {
  const notificationData = {
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || {},
    read: false,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(notificationsCollection, notificationData)
  return docRef.id
}

/**
 * 取得使用者的通知
 */
export async function getUserNotifications(
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[]
}

/**
 * 取得未讀通知數量
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    where('read', '==', false)
  )
  const snapshot = await getDocs(q)
  return snapshot.size
}

/**
 * 標記通知為已讀
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId)
  await updateDoc(notificationRef, { read: true })
}

/**
 * 標記所有通知為已讀
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    where('read', '==', false)
  )
  const snapshot = await getDocs(q)
  
  const batch = writeBatch(db)
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true })
  })
  await batch.commit()
}

/**
 * 刪除通知
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId)
  await deleteDoc(notificationRef)
}

/**
 * 訂閱使用者通知
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[]
      callback(notifications)
    },
    (error) => {
      console.error('通知訂閱錯誤:', error)
      // 即使發生錯誤，也回傳空陣列讓 loading 狀態結束
      callback([])
    }
  )
}

/**
 * 發送通知給行程所有成員（排除發送者）
 */
export async function notifyTripMembers(
  tripId: string,
  senderId: string,
  data: Omit<CreateNotificationData, 'userId'>
): Promise<void> {
  const membersRef = collection(db, 'trips', tripId, 'members')
  const membersSnap = await getDocs(membersRef)

  const notifications = membersSnap.docs
    .filter(doc => doc.data().userId !== senderId)
    .map(doc => createNotification({
      userId: doc.data().userId,
      ...data,
    }))

  await Promise.all(notifications)
}

// ==================== 留言 ====================

/**
 * 建立留言
 */
export async function createComment(data: CreateCommentData): Promise<string> {
  const commentsRef = collection(db, 'trips', data.tripId, 'comments')
  
  const commentData = {
    userId: data.userId,
    content: data.content,
    mentions: data.mentions || [],
    replyTo: data.replyTo || null,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(commentsRef, commentData)
  
  // 如果有提及的使用者，發送通知
  if (data.mentions && data.mentions.length > 0) {
    const userRef = doc(db, 'users', data.userId)
    const userSnap = await getDoc(userRef)
    const userName = userSnap.exists() ? userSnap.data().displayName : '使用者'
    
    const tripRef = doc(db, 'trips', data.tripId)
    const tripSnap = await getDoc(tripRef)
    const tripTitle = tripSnap.exists() ? tripSnap.data().title : '行程'

    for (const mentionedUserId of data.mentions) {
      await createNotification({
        userId: mentionedUserId,
        type: 'comment_mentioned',
        title: '有人提及您',
        message: `${userName} 在「${tripTitle}」中提及了您`,
        data: {
          tripId: data.tripId,
          tripTitle,
          commentId: docRef.id,
          senderId: data.userId,
          senderName: userName,
        },
      })
    }
  }

  return docRef.id
}

/**
 * 取得行程留言
 */
export async function getTripComments(tripId: string): Promise<CommentWithUser[]> {
  const commentsRef = collection(db, 'trips', tripId, 'comments')
  const q = query(commentsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  const comments: CommentWithUser[] = []
  
  for (const commentDoc of snapshot.docs) {
    const data = commentDoc.data()
    
    // 取得使用者資料
    const userRef = doc(db, 'users', data.userId)
    const userSnap = await getDoc(userRef)
    const userData = userSnap.exists() ? userSnap.data() : null

    comments.push({
      id: commentDoc.id,
      tripId,
      userId: data.userId,
      content: data.content,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      mentions: data.mentions,
      replyTo: data.replyTo,
      user: userData ? {
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        email: userData.email,
      } : {
        displayName: '未知使用者',
        photoURL: null,
        email: '',
      },
    })
  }

  return comments
}

/**
 * 更新留言
 */
export async function updateComment(
  tripId: string,
  commentId: string,
  content: string
): Promise<void> {
  const commentRef = doc(db, 'trips', tripId, 'comments', commentId)
  await updateDoc(commentRef, {
    content,
    updatedAt: serverTimestamp(),
  })
}

/**
 * 刪除留言
 */
export async function deleteComment(tripId: string, commentId: string): Promise<void> {
  const commentRef = doc(db, 'trips', tripId, 'comments', commentId)
  await deleteDoc(commentRef)
}

/**
 * 訂閱行程留言
 */
export function subscribeToTripComments(
  tripId: string,
  callback: (comments: CommentWithUser[]) => void
): () => void {
  const commentsRef = collection(db, 'trips', tripId, 'comments')
  const q = query(commentsRef, orderBy('createdAt', 'desc'))

  return onSnapshot(q, async (snapshot) => {
    const comments: CommentWithUser[] = []
    
    for (const commentDoc of snapshot.docs) {
      const data = commentDoc.data()
      
      // 取得使用者資料
      const userRef = doc(db, 'users', data.userId)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.exists() ? userSnap.data() : null

      comments.push({
        id: commentDoc.id,
        tripId,
        userId: data.userId,
        content: data.content,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        mentions: data.mentions,
        replyTo: data.replyTo,
        user: userData ? {
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          email: userData.email,
        } : {
          displayName: '未知使用者',
          photoURL: null,
          email: '',
        },
      })
    }

    callback(comments)
  })
}

// ==================== 活動記錄 ====================

/**
 * 建立活動記錄
 */
export async function createActivity(data: CreateActivityData): Promise<string> {
  const activitiesRef = collection(db, 'trips', data.tripId, 'activities')
  
  const activityData = {
    userId: data.userId,
    userName: data.userName,
    userPhotoURL: data.userPhotoURL,
    type: data.type,
    description: data.description,
    metadata: data.metadata || {},
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(activitiesRef, activityData)
  return docRef.id
}

/**
 * 取得行程活動記錄
 */
export async function getTripActivities(
  tripId: string,
  limitCount: number = 50
): Promise<Activity[]> {
  const activitiesRef = collection(db, 'trips', tripId, 'activities')
  const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(limitCount))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => ({
    id: doc.id,
    tripId,
    ...doc.data(),
  })) as Activity[]
}

/**
 * 訂閱行程活動記錄
 */
export function subscribeToTripActivities(
  tripId: string,
  callback: (activities: Activity[]) => void
): () => void {
  const activitiesRef = collection(db, 'trips', tripId, 'activities')
  const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(50))

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      tripId,
      ...doc.data(),
    })) as Activity[]
    callback(activities)
  })
}

// ==================== 成員管理擴展 ====================

/**
 * 更新成員角色並記錄活動
 */
export async function updateMemberRoleWithActivity(
  tripId: string,
  memberId: string,
  userId: string,
  newRole: MemberRole,
  currentUser: { id: string; displayName: string; photoURL: string | null }
): Promise<void> {
  // 取得成員資料
  const memberRef = doc(db, 'trips', tripId, 'members', memberId)
  const memberSnap = await getDoc(memberRef)
  
  if (!memberSnap.exists()) {
    throw new Error('成員不存在')
  }

  const memberData = memberSnap.data()
  const oldRole = memberData.role

  // 更新角色
  await updateDoc(memberRef, { role: newRole })

  // 更新 tripMembers 集合
  const tripMembersQuery = query(
    collection(db, 'tripMembers'),
    where('tripId', '==', tripId),
    where('userId', '==', userId)
  )
  const tripMembersSnap = await getDocs(tripMembersQuery)
  for (const doc of tripMembersSnap.docs) {
    await updateDoc(doc.ref, { role: newRole })
  }

  // 取得被變更者資訊
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const targetUserName = userSnap.exists() ? userSnap.data().displayName : '使用者'

  // 記錄活動
  await createActivity({
    tripId,
    userId: currentUser.id,
    userName: currentUser.displayName,
    userPhotoURL: currentUser.photoURL,
    type: 'role_changed',
    description: `將 ${targetUserName} 的角色從「${getRoleName(oldRole)}」變更為「${getRoleName(newRole)}」`,
    metadata: { memberId, oldRole, newRole },
  })

  // 發送通知給被變更者
  await createNotification({
    userId,
    type: 'role_changed',
    title: '角色已變更',
    message: `您在行程中的角色已變更為「${getRoleName(newRole)}」`,
    data: {
      tripId,
      newRole,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
    },
  })
}

/**
 * 移除成員並記錄活動
 */
export async function removeMemberWithActivity(
  tripId: string,
  memberId: string,
  userId: string,
  currentUser: { id: string; displayName: string; photoURL: string | null }
): Promise<void> {
  // 取得被移除者資訊
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const targetUserName = userSnap.exists() ? userSnap.data().displayName : '使用者'

  // 移除成員
  const batch = writeBatch(db)

  // 刪除 trips/{tripId}/members 中的記錄
  const memberRef = doc(db, 'trips', tripId, 'members', memberId)
  batch.delete(memberRef)

  // 刪除 tripMembers 中的記錄
  const tripMembersQuery = query(
    collection(db, 'tripMembers'),
    where('tripId', '==', tripId),
    where('userId', '==', userId)
  )
  const tripMembersSnap = await getDocs(tripMembersQuery)
  tripMembersSnap.docs.forEach(doc => batch.delete(doc.ref))

  await batch.commit()

  // 記錄活動
  await createActivity({
    tripId,
    userId: currentUser.id,
    userName: currentUser.displayName,
    userPhotoURL: currentUser.photoURL,
    type: 'member_removed',
    description: `將 ${targetUserName} 移出行程`,
    metadata: { removedUserId: userId },
  })

  // 發送通知給被移除者
  const tripRef = doc(db, 'trips', tripId)
  const tripSnap = await getDoc(tripRef)
  const tripTitle = tripSnap.exists() ? tripSnap.data().title : '行程'

  await createNotification({
    userId,
    type: 'member_left',
    title: '已被移出行程',
    message: `您已被移出「${tripTitle}」`,
    data: {
      tripId,
      tripTitle,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
    },
  })
}

/**
 * 離開行程
 */
export async function leaveTrip(
  tripId: string,
  user: { id: string; displayName: string; photoURL: string | null }
): Promise<void> {
  // 查找成員記錄
  const membersQuery = query(
    collection(db, 'trips', tripId, 'members'),
    where('userId', '==', user.id)
  )
  const membersSnap = await getDocs(membersQuery)
  
  if (membersSnap.empty) {
    throw new Error('您不是此行程的成員')
  }

  const memberDoc = membersSnap.docs[0]
  const memberData = memberDoc.data()

  if (memberData.role === 'owner') {
    throw new Error('擁有者無法離開行程，請先轉移擁有權')
  }

  // 移除成員
  const batch = writeBatch(db)

  // 刪除 trips/{tripId}/members 中的記錄
  batch.delete(memberDoc.ref)

  // 刪除 tripMembers 中的記錄
  const tripMembersQuery = query(
    collection(db, 'tripMembers'),
    where('tripId', '==', tripId),
    where('userId', '==', user.id)
  )
  const tripMembersSnap = await getDocs(tripMembersQuery)
  tripMembersSnap.docs.forEach(doc => batch.delete(doc.ref))

  await batch.commit()

  // 記錄活動
  await createActivity({
    tripId,
    userId: user.id,
    userName: user.displayName,
    userPhotoURL: user.photoURL,
    type: 'member_left',
    description: `${user.displayName} 離開了行程`,
    metadata: {},
  })
}

// ==================== 輔助函式 ====================

/**
 * 取得角色名稱
 */
function getRoleName(role: MemberRole): string {
  switch (role) {
    case 'owner':
      return '擁有者'
    case 'editor':
      return '編輯者'
    case 'viewer':
      return '檢視者'
    default:
      return '未知'
  }
}

/**
 * 取得邀請連結
 */
export function getInviteLink(token: string): string {
  return `${window.location.origin}/invite/${token}`
}

/**
 * 複製邀請連結到剪貼簿
 */
export async function copyInviteLink(token: string): Promise<boolean> {
  try {
    const link = getInviteLink(token)
    await navigator.clipboard.writeText(link)
    return true
  } catch (error) {
    console.error('複製連結失敗:', error)
    return false
  }
}