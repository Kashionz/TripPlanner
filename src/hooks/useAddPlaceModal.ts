import type { 
  PlaceFormData, 
  InputMode, 
  FormStep,
  FormErrors,
  LocationPickResult 
} from '@/components/itinerary/AddPlaceModal/types'
import type { PlaceCategory } from '@/types/place'
import { detectPlaceCategory } from '@/services/placeService'
import { saveToSearchHistory } from '@/services/searchHistoryService'
import { useState, useCallback, useEffect } from 'react'

interface UseAddPlaceModalProps {
  previousPlace?: {
    endTime: string | null
    category: PlaceCategory
  }
}

/**
 * 新增景點表單邏輯 Hook
 */
export function useAddPlaceModal({ previousPlace }: UseAddPlaceModalProps = {}) {
  const [mode, setMode] = useState<InputMode>('search')
  const [step, setStep] = useState<FormStep>('place-info')
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  
  // 初始化表單資料
  const [formData, setFormData] = useState<Partial<PlaceFormData>>({
    category: previousPlace?.category || 'attraction',
    startTime: suggestStartTime(previousPlace?.endTime),
    duration: 60,
    note: ''
  })

  // 重置表單
  const reset = useCallback(() => {
    setMode('search')
    setStep('place-info')
    setSelectedPlace(null)
    setErrors({})
    setFormData({
      category: previousPlace?.category || 'attraction',
      startTime: suggestStartTime(previousPlace?.endTime),
      duration: 60,
      note: ''
    })
  }, [previousPlace])

  // 從 Google Place 填入資料
  const fillFromGooglePlace = useCallback((place: google.maps.places.PlaceResult) => {
    const category = detectPlaceCategory(place.types)
    
    setSelectedPlace(place)
    setFormData(prev => ({
      ...prev,
      name: place.name || '',
      address: place.formatted_address || '',
      lat: place.geometry?.location?.lat() || 0,
      lng: place.geometry?.location?.lng() || 0,
      placeId: place.place_id,
      photos: place.photos?.slice(0, 5).map(photo => 
        photo.getUrl({ maxWidth: 400, maxHeight: 300 })
      ),
      rating: place.rating,
      ratingTotal: place.user_ratings_total,
      category,
      duration: getDefaultDuration(category)
    }))
    
    // 清除錯誤
    setErrors({})
    
    // 切換到詳細資訊步驟
    setStep('details')
  }, [])

  // 從熱門景點或搜尋歷史填入
  const fillFromQuickAccess = useCallback((item: {
    name: string
    address: string
    lat: number
    lng: number
    category?: PlaceCategory
  }) => {
    const category = item.category || 'attraction'
    
    setFormData(prev => ({
      ...prev,
      name: item.name,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      category,
      duration: getDefaultDuration(category)
    }))
    
    setErrors({})
    setStep('details')
  }, [])

  // 切換到手動模式
  const switchToManual = useCallback(() => {
    setMode('manual')
    setStep('details')  // 直接進入詳細資訊步驟
    
    // 如果已有 Google 資料，清除 Google 特有資料但保留基本資訊
    if (selectedPlace) {
      setSelectedPlace(null)
      setFormData(prev => ({
        ...prev,
        placeId: undefined,
        photos: undefined,
        rating: undefined,
        ratingTotal: undefined,
        lat: 0,  // 清除經緯度，將從地址轉換
        lng: 0
      }))
    }
  }, [selectedPlace])

  // 切換回搜尋模式
  const switchToSearch = useCallback(() => {
    setMode('search')
    setStep('place-info')
  }, [])

  // 更新表單欄位
  const updateField = useCallback(<K extends keyof PlaceFormData>(
    field: K,
    value: PlaceFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除該欄位的錯誤
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }, [errors])

  // 更新位置（手動模式使用）
  const updateLocation = useCallback((location: LocationPickResult) => {
    setFormData(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      address: location.address || prev.address
    }))
    
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }))
    }
  }, [errors])

  // 驗證表單
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    // 驗證景點名稱
    if (!formData.name?.trim()) {
      newErrors.name = '請輸入景點名稱'
    }
    
    // 手動模式下驗證地址（必填）
    if (mode === 'manual' && !formData.address?.trim()) {
      newErrors.address = '請輸入地址'
    }
    
    // 驗證停留時間
    if (!formData.duration || formData.duration < 0) {
      newErrors.duration = '請選擇停留時間'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, mode])

  // 取得完整的表單資料
  const getFormData = useCallback((): PlaceFormData | null => {
    if (!validate()) {
      return null
    }
    
    return {
      name: formData.name!,
      address: formData.address || '',
      lat: formData.lat!,
      lng: formData.lng!,
      placeId: formData.placeId,
      photos: formData.photos,
      rating: formData.rating,
      ratingTotal: formData.ratingTotal,
      category: formData.category!,
      startTime: formData.startTime || null,
      duration: formData.duration!,
      note: formData.note || ''
    }
  }, [formData, validate])

  // 儲存到搜尋歷史
  const saveHistory = useCallback(() => {
    if (formData.name && formData.lat && formData.lng) {
      saveToSearchHistory({
        name: formData.name,
        address: formData.address || '',
        lat: formData.lat,
        lng: formData.lng,
        placeId: formData.placeId
      })
    }
  }, [formData])

  // 當類別改變時，更新預設停留時間
  useEffect(() => {
    if (formData.category && !selectedPlace) {
      // 只在手動模式或未從搜尋選擇時更新
      setFormData(prev => ({
        ...prev,
        duration: getDefaultDuration(formData.category!)
      }))
    }
  }, [formData.category, selectedPlace])

  return {
    // 狀態
    mode,
    step,
    formData,
    selectedPlace,
    errors,
    
    // 操作
    reset,
    fillFromGooglePlace,
    fillFromQuickAccess,
    switchToManual,
    switchToSearch,
    updateField,
    updateLocation,
    validate,
    getFormData,
    saveHistory,
    setStep
  }
}

/**
 * 根據前一個景點的結束時間建議開始時間
 */
function suggestStartTime(previousEndTime?: string | null): string | null {
  if (!previousEndTime) return null
  
  try {
    const [hours, minutes] = previousEndTime.split(':').map(Number)
    // 加上 30 分鐘的交通時間
    const totalMinutes = hours * 60 + minutes + 30
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMinutes = totalMinutes % 60
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
  } catch {
    return null
  }
}

/**
 * 根據類別取得預設停留時間（分鐘）
 */
function getDefaultDuration(category: PlaceCategory): number {
  const defaults: Record<PlaceCategory, number> = {
    attraction: 120,  // 景點 2 小時
    restaurant: 90,   // 餐廳 1.5 小時
    hotel: 0,         // 住宿不計算停留時間
    transport: 30,    // 交通 30 分鐘
    other: 60         // 其他 1 小時
  }
  
  return defaults[category]
}