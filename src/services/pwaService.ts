// PWA Service - Service Worker 註冊與管理

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// 儲存安裝提示事件
let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * 註冊 Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker 不支援')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[PWA] Service Worker 註冊成功:', registration.scope)

    // 監聽更新事件
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新版本可用
            console.log('[PWA] 新版本可用')
            dispatchUpdateEvent()
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[PWA] Service Worker 註冊失敗:', error)
    return null
  }
}

/**
 * 取消註冊 Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const result = await registration.unregister()
    console.log('[PWA] Service Worker 取消註冊:', result)
    return result
  } catch (error) {
    console.error('[PWA] Service Worker 取消註冊失敗:', error)
    return false
  }
}

/**
 * 檢查更新
 */
export async function checkForUpdates(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
    console.log('[PWA] 已檢查更新')
  } catch (error) {
    console.error('[PWA] 檢查更新失敗:', error)
  }
}

/**
 * 跳過等待，立即啟用新版本
 */
export function skipWaiting(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
}

/**
 * 發送更新事件
 */
function dispatchUpdateEvent(): void {
  window.dispatchEvent(new CustomEvent('pwa-update-available'))
}

// ==================== 安裝相關 ====================

/**
 * 設定安裝提示監聽
 */
export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // 阻止自動顯示安裝提示
    event.preventDefault()
    // 儲存事件供稍後使用
    deferredPrompt = event as BeforeInstallPromptEvent
    // 發送可安裝事件
    window.dispatchEvent(new CustomEvent('pwa-installable'))
    console.log('[PWA] 應用程式可安裝')
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new CustomEvent('pwa-installed'))
    console.log('[PWA] 應用程式已安裝')
  })
}

/**
 * 檢查是否可安裝
 */
export function isInstallable(): boolean {
  return deferredPrompt !== null
}

/**
 * 檢查是否已安裝 (獨立模式)
 */
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

/**
 * 顯示安裝提示
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] 沒有可用的安裝提示')
    return false
  }

  try {
    // 顯示安裝提示
    await deferredPrompt.prompt()
    // 等待使用者回應
    const { outcome } = await deferredPrompt.userChoice
    
    console.log('[PWA] 安裝提示結果:', outcome)
    
    // 清除儲存的提示
    deferredPrompt = null
    
    return outcome === 'accepted'
  } catch (error) {
    console.error('[PWA] 安裝提示失敗:', error)
    return false
  }
}

// ==================== 快取相關 ====================

/**
 * 快取指定 URL
 */
export function cacheUrls(urls: string[]): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.controller?.postMessage({
    type: 'CACHE_URLS',
    data: { urls },
  })
}

/**
 * 清除快取
 */
export function clearCache(cacheName?: string): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.controller?.postMessage({
    type: 'CLEAR_CACHE',
    data: { cacheName },
  })
}

/**
 * 取得快取大小
 */
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) {
    return 0
  }

  try {
    const cacheNames = await caches.keys()
    let totalSize = 0

    for (const name of cacheNames) {
      const cache = await caches.open(name)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  } catch (error) {
    console.error('[PWA] 取得快取大小失敗:', error)
    return 0
  }
}

/**
 * 格式化位元組大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// ==================== 網路狀態 ====================

/**
 * 檢查是否在線
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * 監聽網路狀態變化
 */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// ==================== 推播通知 ====================

/**
 * 檢查推播通知權限
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * 請求推播通知權限
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('[PWA] 通知權限:', permission)
    return permission
  } catch (error) {
    console.error('[PWA] 請求通知權限失敗:', error)
    return 'denied'
  }
}

/**
 * 訂閱推播通知
 */
export async function subscribePush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[PWA] 推播通知不支援')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })

    console.log('[PWA] 推播訂閱成功:', subscription)
    return subscription
  } catch (error) {
    console.error('[PWA] 推播訂閱失敗:', error)
    return null
  }
}

/**
 * 取消推播訂閱
 */
export async function unsubscribePush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      const result = await subscription.unsubscribe()
      console.log('[PWA] 取消推播訂閱:', result)
      return result
    }
    
    return false
  } catch (error) {
    console.error('[PWA] 取消推播訂閱失敗:', error)
    return false
  }
}

// 輔助函式：轉換 VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

// ==================== 背景同步 ====================

/**
 * 註冊背景同步
 */
export async function registerSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('[PWA] 背景同步不支援')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await (registration as any).sync.register(tag)
    console.log('[PWA] 背景同步註冊成功:', tag)
    return true
  } catch (error) {
    console.error('[PWA] 背景同步註冊失敗:', error)
    return false
  }
}