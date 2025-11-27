import * as settingsService from '@/services/settingsService'
import type { UserSettings } from '@/types/settings'
import { create } from 'zustand'

interface SettingsState {
  // 設定資料
  settings: UserSettings | null
  loading: boolean
  error: string | null

  // 訂閱取消函數
  unsubscribeSettings: (() => void) | null

  // Actions
  fetchSettings: (userId: string) => Promise<void>
  updateSettings: (userId: string, settings: Partial<UserSettings>) => Promise<void>
  resetSettings: (userId: string) => Promise<void>
  subscribeToSettings: (userId: string) => void
  exportUserData: (userId: string) => Promise<void>
  deleteAccount: (userId: string) => Promise<void>
  clearError: () => void
  cleanup: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // 初始狀態
  settings: null,
  loading: false,
  error: null,
  unsubscribeSettings: null,

  // 取得使用者設定
  fetchSettings: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const settings = await settingsService.getUserSettings(userId)
      set({ settings, loading: false })
    } catch (error: any) {
      console.error('取得設定失敗:', error)
      set({
        error: error.message || '取得設定失敗',
        loading: false,
      })
    }
  },

  // 更新使用者設定
  updateSettings: async (userId: string, newSettings: Partial<UserSettings>) => {
    console.log('[SettingsStore] updateSettings 被調用:', { userId, newSettings })
    set({ loading: true, error: null })
    try {
      await settingsService.updateUserSettings(userId, newSettings)
      console.log('[SettingsStore] Firebase 更新成功')
      
      // 更新本地狀態
      set((state) => {
        const updatedSettings = state.settings ? { ...state.settings, ...newSettings } : null
        console.log('[SettingsStore] 本地狀態更新:', {
          舊設定: state.settings,
          新設定: updatedSettings
        })
        return {
          settings: updatedSettings,
          loading: false,
        }
      })
    } catch (error: any) {
      console.error('[SettingsStore] 更新設定失敗:', error)
      set({
        error: error.message || '更新設定失敗',
        loading: false,
      })
      throw error
    }
  },

  // 重設為預設設定
  resetSettings: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      await settingsService.resetSettings(userId)
      await get().fetchSettings(userId)
    } catch (error: any) {
      console.error('重設設定失敗:', error)
      set({
        error: error.message || '重設設定失敗',
        loading: false,
      })
      throw error
    }
  },

  // 訂閱設定變更（即時更新）
  subscribeToSettings: (userId: string) => {
    // 先取消現有訂閱
    const { unsubscribeSettings } = get()
    if (unsubscribeSettings) {
      unsubscribeSettings()
    }

    set({ loading: true, error: null })

    const unsubscribe = settingsService.subscribeToSettings(userId, (settings) => {
      console.log('[SettingsStore] 收到 Firebase 訂閱更新:', settings)
      set({ settings, loading: false })
    })

    set({ unsubscribeSettings: unsubscribe })
  },

  // 匯出使用者資料
  exportUserData: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const blob = await settingsService.exportUserData(userId)
      
      // 建立下載連結
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tripplanner-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      set({ loading: false })
    } catch (error: any) {
      console.error('匯出資料失敗:', error)
      set({
        error: error.message || '匯出資料失敗',
        loading: false,
      })
      throw error
    }
  },

  // 刪除使用者帳號
  deleteAccount: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      await settingsService.deleteUserAccount(userId)
      // 清理所有狀態
      get().cleanup()
    } catch (error: any) {
      console.error('刪除帳號失敗:', error)
      set({
        error: error.message || '刪除帳號失敗',
        loading: false,
      })
      throw error
    }
  },

  // 清除錯誤訊息
  clearError: () => set({ error: null }),

  // 清理所有訂閱和狀態
  cleanup: () => {
    const { unsubscribeSettings } = get()
    if (unsubscribeSettings) {
      unsubscribeSettings()
    }

    set({
      settings: null,
      loading: false,
      error: null,
      unsubscribeSettings: null,
    })
  },
}))