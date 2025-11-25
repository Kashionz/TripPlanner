import { Timestamp } from 'firebase/firestore'

export interface User {
  id: string
  email: string
  displayName: string
  photoURL: string | null
  createdAt: Timestamp
  lastLoginAt: Timestamp
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}