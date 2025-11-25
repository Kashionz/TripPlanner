import { Timestamp } from 'firebase/firestore'

export type TripStatus = 'planning' | 'ongoing' | 'completed'
export type MemberRole = 'owner' | 'editor' | 'viewer'

export interface Trip {
  id: string
  title: string
  description: string
  coverImage: string | null
  startDate: Timestamp
  endDate: Timestamp
  ownerId: string
  status: TripStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TripMember {
  id: string
  tripId: string
  userId: string
  role: MemberRole
  joinedAt: Timestamp
  // 使用者資料 (join 查詢用)
  user?: {
    displayName: string
    photoURL: string | null
    email: string
  }
}

export interface Day {
  id: string
  tripId: string
  date: Timestamp
  dayNumber: number
  note: string
}

export interface Comment {
  id: string
  tripId: string
  userId: string
  content: string
  createdAt: Timestamp
  // 使用者資料 (join 查詢用)
  user?: {
    displayName: string
    photoURL: string | null
  }
}

// 前端狀態用的型別
export interface TripWithDetails extends Trip {
  members: TripMember[]
  days: Day[]
}