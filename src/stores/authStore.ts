import { create } from 'zustand'
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/services/firebase'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  error: string | null
  initialized: boolean
  
  // Actions
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  initialize: () => () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: false,
  error: null,
  initialized: false,

  signInWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      // 檢查使用者是否已存在於 Firestore
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        // 新使用者，建立文件
        const newUser: Omit<User, 'id'> = {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp() as any,
          lastLoginAt: serverTimestamp() as any,
        }
        await setDoc(userRef, newUser)
        set({ 
          user: { id: firebaseUser.uid, ...newUser } as User,
          firebaseUser,
          loading: false 
        })
      } else {
        // 現有使用者，更新最後登入時間
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true })
        const userData = userSnap.data() as Omit<User, 'id'>
        set({ 
          user: { id: firebaseUser.uid, ...userData },
          firebaseUser,
          loading: false 
        })
      }
    } catch (error: any) {
      console.error('Google 登入失敗:', error)
      set({ 
        error: error.message || '登入失敗，請稍後再試',
        loading: false 
      })
    }
  },

  signOut: async () => {
    set({ loading: true, error: null })
    try {
      await firebaseSignOut(auth)
      set({ user: null, firebaseUser: null, loading: false })
    } catch (error: any) {
      console.error('登出失敗:', error)
      set({ 
        error: error.message || '登出失敗，請稍後再試',
        loading: false 
      })
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 使用者已登入
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          const userData = userSnap.data() as Omit<User, 'id'>
          set({ 
            user: { id: firebaseUser.uid, ...userData },
            firebaseUser,
            initialized: true,
            loading: false
          })
        } else {
          // 使用者文件不存在（可能是首次登入尚未完成）
          set({ 
            firebaseUser,
            initialized: true,
            loading: false
          })
        }
      } else {
        // 使用者未登入
        set({ 
          user: null, 
          firebaseUser: null,
          initialized: true,
          loading: false
        })
      }
    })

    return unsubscribe
  },
}))