import { useState, useEffect, useCallback } from 'react'
import type { Place, PlaceCategory, RouteInfo } from '@/types/place'
import {
  getDayPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  reorderPlaces,
  subscribeToDayPlaces,
  createPlaceFromGoogle,
  calculateRoutes,
  type CreatePlaceData,
  type UpdatePlaceData,
} from '@/services/placeService'

// 單一天數的景點 Hook
export function useDayPlaces(tripId: string | undefined, dayId: string | undefined) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId || !dayId) {
      setPlaces([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    // 使用即時訂閱
    const unsubscribe = subscribeToDayPlaces(tripId, dayId, (updatedPlaces) => {
      setPlaces(updatedPlaces)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [tripId, dayId])

  return { places, loading, error }
}

// 景點操作 Hook
export function usePlaceActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addPlace = useCallback(async (
    tripId: string,
    dayId: string,
    googlePlace: google.maps.places.PlaceResult,
    category: PlaceCategory
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const placeData = createPlaceFromGoogle(googlePlace, category)
      const placeId = await createPlace(tripId, dayId, {
        ...placeData,
        dayId,
      })
      return placeId
    } catch (err) {
      console.error('新增景點失敗:', err)
      setError('新增景點失敗')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const editPlace = useCallback(async (
    tripId: string,
    dayId: string,
    placeId: string,
    data: UpdatePlaceData
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await updatePlace(tripId, dayId, placeId, data)
      return true
    } catch (err) {
      console.error('更新景點失敗:', err)
      setError('更新景點失敗')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const removePlace = useCallback(async (
    tripId: string,
    dayId: string,
    placeId: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await deletePlace(tripId, dayId, placeId)
      return true
    } catch (err) {
      console.error('刪除景點失敗:', err)
      setError('刪除景點失敗')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const reorder = useCallback(async (
    tripId: string,
    dayId: string,
    newOrder: string[]
  ): Promise<boolean> => {
    try {
      await reorderPlaces(tripId, dayId, newOrder)
      return true
    } catch (err) {
      console.error('重新排序失敗:', err)
      return false
    }
  }, [])

  return {
    loading,
    error,
    addPlace,
    editPlace,
    removePlace,
    reorder,
  }
}

// 路線計算 Hook
export function useRoutes(places: Place[]) {
  const [routes, setRoutes] = useState<RouteInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (places.length < 2) {
      setRoutes([])
      return
    }

    let cancelled = false

    const fetchRoutes = async () => {
      setLoading(true)
      try {
        const calculatedRoutes = await calculateRoutes(places)
        if (!cancelled) {
          setRoutes(calculatedRoutes)
        }
      } catch (err) {
        console.error('計算路線失敗:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    // 延遲計算以避免過於頻繁的 API 呼叫
    const timer = setTimeout(fetchRoutes, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [places])

  return { routes, loading }
}

// 多天數景點管理 Hook
export function useTripPlaces(tripId: string | undefined, dayIds: string[]) {
  const [placesMap, setPlacesMap] = useState<Map<string, Place[]>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId || dayIds.length === 0) {
      setPlacesMap(new Map())
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribes: (() => void)[] = []

    dayIds.forEach((dayId) => {
      const unsubscribe = subscribeToDayPlaces(tripId, dayId, (places) => {
        setPlacesMap((prev) => {
          const newMap = new Map(prev)
          newMap.set(dayId, places)
          return newMap
        })
      })
      unsubscribes.push(unsubscribe)
    })

    setLoading(false)

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [tripId, dayIds.join(',')])

  // 取得所有景點（扁平化）
  const allPlaces = Array.from(placesMap.values()).flat()

  // 取得指定天數的景點
  const getPlacesByDay = useCallback((dayId: string): Place[] => {
    return placesMap.get(dayId) || []
  }, [placesMap])

  return {
    placesMap,
    allPlaces,
    getPlacesByDay,
    loading,
  }
}

// 景點選擇狀態 Hook
export function useSelectedPlace() {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)

  const selectPlace = useCallback((placeId: string | null) => {
    setSelectedPlaceId(placeId)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedPlaceId(null)
  }, [])

  return {
    selectedPlaceId,
    selectPlace,
    clearSelection,
  }
}