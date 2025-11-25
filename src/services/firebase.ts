import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase 設定
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// 開發環境檢查設定
if (import.meta.env.DEV) {
  console.log('Firebase Config Loaded:', {
    apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  })
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化服務
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Google 登入 Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account', // 每次都顯示帳號選擇
})

export default app