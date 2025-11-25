export type PlaceCategory = 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'other'

export interface Place {
  id: string
  dayId: string
  placeId: string // Google Place ID
  name: string
  address: string
  lat: number
  lng: number
  category: PlaceCategory
  startTime: string | null // HH:mm 格式
  endTime: string | null
  duration: number // 分鐘
  note: string
  order: number // 排序順序
  photos: string[]
}

// Google Places API 回傳的資料結構
export interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  photos?: {
    photo_reference: string
    width: number
    height: number
  }[]
  rating?: number
  user_ratings_total?: number
  types?: string[]
}

// 路線資訊
export interface RouteInfo {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  distance: string
  duration: string
  durationValue: number // 秒數
}