import { useState, useEffect, useCallback } from 'react'
import {
  registerServiceWorker,
  checkForUpdates,
  skipWaiting,
  setupInstallPrompt,
  isInstallable,
  isInstalled,
  promptInstall,
  isOnline,
  onNetworkChange,
  getCacheSize,
  formatBytes,
  clearCache,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/services/pwaService'

interface UsePWAReturn {
  // 狀態
  isOnline: boolean
  isInstallable: boolean
  isInstalled: boolean
  hasUpdate: boolean
  cacheSize: string
  notificationPermission: NotificationPermission
  
  // 動作
  install: () => Promise<boolean>
  update: () => void
  checkUpdate: () => Promise<void>
  clearAllCache: () => void
  requestNotification: () => Promise<NotificationPermission>
}

/**
 * PWA 功能 Hook
 */
export function usePWA(): UsePWAReturn {
  const [online, setOnline] = useState(isOnline())
  const [installable, setInstallable] = useState(isInstallable())
  const [installed, setInstalled] = useState(isInstalled())
  const [hasUpdate, setHasUpdate] = useState(false)
  const [cacheSize, setCacheSize] = useState('0 B')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  )

  // 初始化
  useEffect(() => {
    // 註冊 Service Worker
    registerServiceWorker()
    
    // 設定安裝提示
    setupInstallPrompt()

    // 監聽網路狀態
    const unsubscribe = onNetworkChange(setOnline)

    // 監聽可安裝事件
    const handleInstallable = () => setInstallable(true)
    const handleInstalled = () => {
      setInstalled(true)
      setInstallable(false)
    }
    const handleUpdate = () => setHasUpdate(true)

    window.addEventListener('pwa-installable', handleInstallable)
    window.addEventListener('pwa-installed', handleInstalled)
    window.addEventListener('pwa-update-available', handleUpdate)

    // 取得快取大小
    getCacheSize().then(size => setCacheSize(formatBytes(size)))

    return () => {
      unsubscribe()
      window.removeEventListener('pwa-installable', handleInstallable)
      window.removeEventListener('pwa-installed', handleInstalled)
      window.removeEventListener('pwa-update-available', handleUpdate)
    }
  }, [])

  // 安裝應用程式
  const install = useCallback(async () => {
    const result = await promptInstall()
    if (result) {
      setInstalled(true)
      setInstallable(false)
    }
    return result
  }, [])

  // 更新應用程式
  const update = useCallback(() => {
    skipWaiting()
    window.location.reload()
  }, [])

  // 檢查更新
  const checkUpdate = useCallback(async () => {
    await checkForUpdates()
  }, [])

  // 清除快取
  const clearAllCache = useCallback(() => {
    clearCache()
    setCacheSize('0 B')
  }, [])

  // 請求通知權限
  const requestNotification = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
    return permission
  }, [])

  return {
    isOnline: online,
    isInstallable: installable,
    isInstalled: installed,
    hasUpdate,
    cacheSize,
    notificationPermission,
    install,
    update,
    checkUpdate,
    clearAllCache,
    requestNotification,
  }
}

/**
 * 網路狀態 Hook
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(isOnline())

  useEffect(() => {
    const unsubscribe = onNetworkChange(setOnline)
    return unsubscribe
  }, [])

  return online
}

/**
 * 更新提示 Hook
 */
export function useUpdatePrompt(): {
  hasUpdate: boolean
  update: () => void
  dismiss: () => void
} {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    const handleUpdate = () => setHasUpdate(true)
    window.addEventListener('pwa-update-available', handleUpdate)
    return () => window.removeEventListener('pwa-update-available', handleUpdate)
  }, [])

  const update = useCallback(() => {
    skipWaiting()
    window.location.reload()
  }, [])

  const dismiss = useCallback(() => {
    setHasUpdate(false)
  }, [])

  return { hasUpdate, update, dismiss }
}

export default usePWA