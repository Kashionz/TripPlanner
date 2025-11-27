import type { PlaceCategory } from '@/types/place'

// 輸入模式
export type InputMode = 'search' | 'manual'

// 表單步驟（手機版使用）
export type FormStep = 'place-info' | 'details'

// 表單資料結構
export interface PlaceFormData {
  // 基本資訊
  name: string
  address: string
  lat: number
  lng: number
  placeId?: string        // Google Place ID (手動輸入時為 undefined)
  photos?: string[]       // 只有 Google 搜尋才有
  rating?: number         // 只有 Google 搜尋才有
  ratingTotal?: number    // 評論總數
  
  // 詳細資訊
  category: PlaceCategory
  startTime: string | null
  duration: number
  note: string
}

// Modal 狀態
export interface ModalState {
  mode: InputMode
  step: FormStep
  selectedPlace: google.maps.places.PlaceResult | null
  formData: Partial<PlaceFormData>
  showMap: boolean
}

// 搜尋歷史項目
export interface SearchHistoryItem {
  name: string
  address: string
  lat: number
  lng: number
  placeId?: string
  timestamp: number
}

// 熱門景點項目
export interface PopularPlaceItem {
  name: string
  address: string
  lat: number
  lng: number
  category: PlaceCategory
  photo?: string
  description?: string
}

// Modal Props
export interface AddPlaceModalProps {
  isOpen: boolean
  onClose: () => void
  onPlaceAdd: (place: google.maps.places.PlaceResult, category: PlaceCategory) => Promise<void>
  previousPlace?: {
    endTime: string | null
    category: PlaceCategory
  }
}

// 地圖選點結果
export interface LocationPickResult {
  lat: number
  lng: number
  address?: string
}

// 表單驗證錯誤
export interface FormErrors {
  name?: string
  address?: string
  location?: string
  startTime?: string
  duration?: string
}