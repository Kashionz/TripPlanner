import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Trip, TripMember, Day, TripWithDetails, MemberRole } from '@/types/trip'

// Collection 參考
const tripsCollection = collection(db, 'trips')

// ==================== Trip CRUD ====================

export interface CreateTripData {
  title: string
  description: string
  coverImage: string | null
  startDate: Date
  endDate: Date
  ownerId: string
}

export interface UpdateTripData {
  title?: string
  description?: string
  coverImage?: string | null
  startDate?: Date
  endDate?: Date
  status?: Trip['status']
}

/**
 * 建立新行程
 */
export async function createTrip(data: CreateTripData): Promise<string> {
  const tripData = {
    title: data.title,
    description: data.description,
    coverImage: data.coverImage,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: Timestamp.fromDate(data.endDate),
    ownerId: data.ownerId,
    status: 'planning' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(tripsCollection, tripData)
  
  // 自動將建立者加入成員列表
  await addTripMember(docRef.id, data.ownerId, 'owner')
  
  // 根據日期範圍自動建立 Day 文件
  await generateDaysForTrip(docRef.id, data.startDate, data.endDate)

  return docRef.id
}

/**
 * 取得單一行程
 */
export async function getTrip(tripId: string): Promise<Trip | null> {
  const docRef = doc(db, 'trips', tripId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Trip
}

/**
 * 取得行程與詳細資訊（包含成員與天數）
 */
export async function getTripWithDetails(tripId: string): Promise<TripWithDetails | null> {
  const trip = await getTrip(tripId)
  if (!trip) return null

  const [members, days] = await Promise.all([
    getTripMembers(tripId),
    getTripDays(tripId),
  ])

  return {
    ...trip,
    members,
    days,
  }
}

/**
 * 取得使用者的所有行程
 */
export async function getUserTrips(userId: string): Promise<Trip[]> {
  // 先查詢使用者是成員的所有行程 ID
  const memberQuery = query(
    collection(db, 'tripMembers'),
    where('userId', '==', userId)
  )
  const memberSnap = await getDocs(memberQuery)
  const tripIds = memberSnap.docs.map(doc => doc.data().tripId)

  if (tripIds.length === 0) {
    return []
  }

  // 查詢這些行程
  const trips: Trip[] = []
  // Firestore 的 in 查詢限制最多 30 個項目
  const chunks = chunkArray(tripIds, 30)
  
  for (const chunk of chunks) {
    const tripsQuery = query(
      tripsCollection,
      where('__name__', 'in', chunk),
      orderBy('updatedAt', 'desc')
    )
    const tripsSnap = await getDocs(tripsQuery)
    tripsSnap.docs.forEach(doc => {
      trips.push({
        id: doc.id,
        ...doc.data(),
      } as Trip)
    })
  }

  // 按更新時間排序
  return trips.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || 0
    const bTime = b.updatedAt?.toMillis?.() || 0
    return bTime - aTime
  })
}

/**
 * 更新行程
 */
export async function updateTrip(tripId: string, data: UpdateTripData): Promise<void> {
  const docRef = doc(db, 'trips', tripId)
  
  const updateData: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  // 轉換日期
  if (data.startDate) {
    updateData.startDate = Timestamp.fromDate(data.startDate)
  }
  if (data.endDate) {
    updateData.endDate = Timestamp.fromDate(data.endDate)
  }

  await updateDoc(docRef, updateData)

  // 如果日期改變，需要重新生成天數
  if (data.startDate || data.endDate) {
    const trip = await getTrip(tripId)
    if (trip) {
      const startDate = data.startDate || trip.startDate.toDate()
      const endDate = data.endDate || trip.endDate.toDate()
      await regenerateDaysForTrip(tripId, startDate, endDate)
    }
  }
}

/**
 * 刪除行程
 */
export async function deleteTrip(tripId: string): Promise<void> {
  const batch = writeBatch(db)

  // 刪除行程本身
  const tripRef = doc(db, 'trips', tripId)
  batch.delete(tripRef)

  // 刪除所有成員
  const membersSnap = await getDocs(collection(db, 'trips', tripId, 'members'))
  membersSnap.docs.forEach(doc => batch.delete(doc.ref))

  // 刪除所有天數
  const daysSnap = await getDocs(collection(db, 'trips', tripId, 'days'))
  daysSnap.docs.forEach(doc => batch.delete(doc.ref))

  // 刪除 tripMembers collection 中的記錄
  const tripMembersQuery = query(
    collection(db, 'tripMembers'),
    where('tripId', '==', tripId)
  )
  const tripMembersSnap = await getDocs(tripMembersQuery)
  tripMembersSnap.docs.forEach(doc => batch.delete(doc.ref))

  await batch.commit()
}

// ==================== Trip Members ====================

/**
 * 新增行程成員
 */
export async function addTripMember(
  tripId: string,
  userId: string,
  role: MemberRole
): Promise<void> {
  const batch = writeBatch(db)

  // 在 trips/{tripId}/members 子集合新增
  const memberRef = doc(collection(db, 'trips', tripId, 'members'))
  batch.set(memberRef, {
    userId,
    role,
    joinedAt: serverTimestamp(),
  })

  // 在 tripMembers 集合新增（用於反向查詢）
  const tripMemberRef = doc(collection(db, 'tripMembers'))
  batch.set(tripMemberRef, {
    tripId,
    userId,
    role,
    joinedAt: serverTimestamp(),
  })

  await batch.commit()
}

/**
 * 取得行程所有成員
 */
export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const membersRef = collection(db, 'trips', tripId, 'members')
  const membersSnap = await getDocs(query(membersRef, orderBy('joinedAt')))

  const members: TripMember[] = []
  for (const memberDoc of membersSnap.docs) {
    const data = memberDoc.data()
    
    // 取得使用者資料
    const userRef = doc(db, 'users', data.userId)
    const userSnap = await getDoc(userRef)
    const userData = userSnap.exists() ? userSnap.data() : null

    members.push({
      id: memberDoc.id,
      tripId,
      userId: data.userId,
      role: data.role,
      joinedAt: data.joinedAt,
      user: userData ? {
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        email: userData.email,
      } : undefined,
    })
  }

  return members
}

/**
 * 更新成員角色
 */
export async function updateMemberRole(
  tripId: string,
  memberId: string,
  role: MemberRole
): Promise<void> {
  const memberRef = doc(db, 'trips', tripId, 'members', memberId)
  await updateDoc(memberRef, { role })
}

/**
 * 移除成員
 */
export async function removeTripMember(tripId: string, memberId: string): Promise<void> {
  const memberRef = doc(db, 'trips', tripId, 'members', memberId)
  const memberSnap = await getDoc(memberRef)
  
  if (!memberSnap.exists()) return

  const userId = memberSnap.data().userId
  const batch = writeBatch(db)

  // 刪除 trips/{tripId}/members 中的記錄
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
}

/**
 * 檢查使用者是否為行程成員
 */
export async function checkMembership(
  tripId: string,
  userId: string
): Promise<{ isMember: boolean; role?: MemberRole }> {
  const membersQuery = query(
    collection(db, 'trips', tripId, 'members'),
    where('userId', '==', userId)
  )
  const membersSnap = await getDocs(membersQuery)

  if (membersSnap.empty) {
    return { isMember: false }
  }

  return {
    isMember: true,
    role: membersSnap.docs[0].data().role as MemberRole,
  }
}

// ==================== Days ====================

/**
 * 根據日期範圍生成天數
 */
async function generateDaysForTrip(
  tripId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  const daysRef = collection(db, 'trips', tripId, 'days')
  const batch = writeBatch(db)

  const currentDate = new Date(startDate)
  let dayNumber = 1

  while (currentDate <= endDate) {
    const dayRef = doc(daysRef)
    batch.set(dayRef, {
      date: Timestamp.fromDate(new Date(currentDate)),
      dayNumber,
      note: '',
    })

    currentDate.setDate(currentDate.getDate() + 1)
    dayNumber++
  }

  await batch.commit()
}

/**
 * 重新生成天數（日期變更時）
 */
async function regenerateDaysForTrip(
  tripId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  // 先刪除所有現有天數
  const daysRef = collection(db, 'trips', tripId, 'days')
  const daysSnap = await getDocs(daysRef)
  
  const batch = writeBatch(db)
  daysSnap.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()

  // 重新生成
  await generateDaysForTrip(tripId, startDate, endDate)
}

/**
 * 取得行程所有天數
 */
export async function getTripDays(tripId: string): Promise<Day[]> {
  const daysRef = collection(db, 'trips', tripId, 'days')
  const daysSnap = await getDocs(query(daysRef, orderBy('dayNumber')))

  return daysSnap.docs.map(doc => ({
    id: doc.id,
    tripId,
    ...doc.data(),
  })) as Day[]
}

/**
 * 更新天數備註
 */
export async function updateDayNote(
  tripId: string,
  dayId: string,
  note: string
): Promise<void> {
  const dayRef = doc(db, 'trips', tripId, 'days', dayId)
  await updateDoc(dayRef, { note })
}

// ==================== Real-time Subscriptions ====================

/**
 * 訂閱行程變更
 */
export function subscribeToTrip(
  tripId: string,
  callback: (trip: Trip | null) => void
): () => void {
  const tripRef = doc(db, 'trips', tripId)
  
  return onSnapshot(tripRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null)
      return
    }

    callback({
      id: docSnap.id,
      ...docSnap.data(),
    } as Trip)
  })
}

/**
 * 訂閱使用者行程列表變更
 */
export function subscribeToUserTrips(
  userId: string,
  callback: (trips: Trip[]) => void
): () => void {
  const memberQuery = query(
    collection(db, 'tripMembers'),
    where('userId', '==', userId)
  )

  return onSnapshot(memberQuery, async (snapshot) => {
    const tripIds = snapshot.docs.map(doc => doc.data().tripId)
    
    if (tripIds.length === 0) {
      callback([])
      return
    }

    const trips: Trip[] = []
    const chunks = chunkArray(tripIds, 30)
    
    for (const chunk of chunks) {
      const tripsQuery = query(
        tripsCollection,
        where('__name__', 'in', chunk)
      )
      const tripsSnap = await getDocs(tripsQuery)
      tripsSnap.docs.forEach(doc => {
        trips.push({
          id: doc.id,
          ...doc.data(),
        } as Trip)
      })
    }

    // 按更新時間排序
    trips.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || 0
      const bTime = b.updatedAt?.toMillis?.() || 0
      return bTime - aTime
    })

    callback(trips)
  })
}

/**
 * 訂閱行程天數變更
 */
export function subscribeToTripDays(
  tripId: string,
  callback: (days: Day[]) => void
): () => void {
  const daysRef = collection(db, 'trips', tripId, 'days')
  const daysQuery = query(daysRef, orderBy('dayNumber'))

  return onSnapshot(daysQuery, (snapshot) => {
    const days = snapshot.docs.map(doc => ({
      id: doc.id,
      tripId,
      ...doc.data(),
    })) as Day[]
    
    callback(days)
  })
}

/**
 * 訂閱行程成員變更
 */
export function subscribeToTripMembers(
  tripId: string,
  callback: (members: TripMember[]) => void
): () => void {
  const membersRef = collection(db, 'trips', tripId, 'members')
  const membersQuery = query(membersRef, orderBy('joinedAt'))

  return onSnapshot(membersQuery, async (snapshot) => {
    const members: TripMember[] = []
    
    for (const memberDoc of snapshot.docs) {
      const data = memberDoc.data()
      
      // 取得使用者資料
      const userRef = doc(db, 'users', data.userId)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.exists() ? userSnap.data() : null

      members.push({
        id: memberDoc.id,
        tripId,
        userId: data.userId,
        role: data.role,
        joinedAt: data.joinedAt,
        user: userData ? {
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          email: userData.email,
        } : undefined,
      })
    }

    callback(members)
  })
}

// ==================== Helpers ====================

/**
 * 將陣列分割成多個小塊
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * 計算行程天數
 */
export function calculateTripDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // 包含開始和結束日
}

/**
 * 格式化日期顯示
 */
export function formatTripDate(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '/')
}