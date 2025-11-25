import { deleteUser } from 'firebase/auth'
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore'
import { DEFAULT_SETTINGS, UserSettings } from '../types/settings'
import { auth, db } from './firebase'

/**
 * 取得使用者設定
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
    const settingsSnap = await getDoc(settingsRef)

    if (settingsSnap.exists()) {
      return settingsSnap.data() as UserSettings
    }

    // 如果設定不存在，建立預設設定
    await setDoc(settingsRef, {
      ...DEFAULT_SETTINGS,
      updatedAt: serverTimestamp(),
    })

    return DEFAULT_SETTINGS
  } catch (error) {
    console.error('Error getting user settings:', error)
    throw error
  }
}

/**
 * 更新使用者設定
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
    
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    // 如果文件不存在，建立新的
    if ((error as any).code === 'not-found') {
      const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
      await setDoc(settingsRef, {
        ...DEFAULT_SETTINGS,
        ...settings,
        updatedAt: serverTimestamp(),
      })
    } else {
      console.error('Error updating user settings:', error)
      throw error
    }
  }
}

/**
 * 重設為預設設定
 */
export async function resetSettings(userId: string): Promise<void> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
    
    await setDoc(settingsRef, {
      ...DEFAULT_SETTINGS,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error resetting settings:', error)
    throw error
  }
}

/**
 * 匯出使用者資料
 */
export async function exportUserData(userId: string): Promise<Blob> {
  try {
    // 收集所有使用者資料
    const userData: any = {
      exportDate: new Date().toISOString(),
      userId,
    }

    // 取得使用者基本資料
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      userData.profile = userSnap.data()
    }

    // 取得設定
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
    const settingsSnap = await getDoc(settingsRef)
    if (settingsSnap.exists()) {
      userData.settings = settingsSnap.data()
    }

    // 取得所有行程
    const tripsRef = collection(db, 'trips')
    const tripsSnap = await getDocs(tripsRef)
    userData.trips = tripsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((trip: any) => 
        trip.userId === userId || 
        trip.members?.some((m: any) => m.userId === userId)
      )

    // 轉換為 JSON Blob
    const jsonString = JSON.stringify(userData, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  } catch (error) {
    console.error('Error exporting user data:', error)
    throw error
  }
}

/**
 * 刪除使用者帳號
 * 注意：這會刪除所有使用者資料和 Firebase Auth 帳號
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('無法刪除帳號：使用者未登入或 ID 不符')
    }

    // 1. 刪除使用者設定
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
    await deleteDoc(settingsRef)

    // 2. 刪除使用者文件
    const userRef = doc(db, 'users', userId)
    await deleteDoc(userRef)

    // 3. 刪除 Firebase Auth 帳號
    await deleteUser(currentUser)
  } catch (error) {
    console.error('Error deleting user account:', error)
    throw error
  }
}

/**
 * 訂閱設定變更
 */
export function subscribeToSettings(
  userId: string,
  callback: (settings: UserSettings) => void
): () => void {
  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences')
  
  const unsubscribe = onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserSettings)
      } else {
        // 如果設定不存在，回傳預設設定
        callback(DEFAULT_SETTINGS)
      }
    },
    (error) => {
      console.error('Error subscribing to settings:', error)
    }
  )

  return unsubscribe
}