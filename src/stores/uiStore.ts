import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // 側邊欄
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Mobile
  mobileMenuOpen: boolean
  
  // Modal
  activeModal: string | null
  modalData: any
  
  // Toast 通知
  toasts: Toast[]
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  openModal: (modalId: string, data?: any) => void
  closeModal: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      activeModal: null,
      modalData: null,
      toasts: [],

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      openModal: (modalId, data = null) => set({ 
        activeModal: modalId, 
        modalData: data 
      }),

      closeModal: () => set({ 
        activeModal: null, 
        modalData: null 
      }),

      addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { ...toast, id }
        
        set((state) => ({ 
          toasts: [...state.toasts, newToast] 
        }))

        // 自動移除
        const duration = toast.duration ?? 5000
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, duration)
        }
      },

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
