import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/stores/tripStore'
import { useAuthStore } from '@/stores/authStore'
import type { CreateTripData, UpdateTripData } from '@/services/tripService'
import { checkMembership } from '@/services/tripService'

/**
 * 行程列表 Hook
 */
export function useTrips() {
  const { user } = useAuthStore()
  const {
    trips,
    tripsLoading,
    tripsError,
    subscribeToUserTrips,
    fetchUserTrips,
  } = useTripStore()

  useEffect(() => {
    if (user?.id) {
      subscribeToUserTrips(user.id)
    }

    return () => {
      // 訂閱清理會在 store 中處理
    }
  }, [user?.id, subscribeToUserTrips])

  const refresh = useCallback(async () => {
    if (user?.id) {
      await fetchUserTrips(user.id)
    }
  }, [user?.id, fetchUserTrips])

  return {
    trips,
    loading: tripsLoading,
    error: tripsError,
    refresh,
  }
}

/**
 * 單一行程 Hook
 */
export function useTrip(tripId: string | undefined) {
  const { user } = useAuthStore()
  const {
    currentTrip,
    currentTripLoading,
    currentTripError,
    subscribeToTrip,
    fetchTrip,
    clearCurrentTrip,
  } = useTripStore()

  useEffect(() => {
    if (tripId) {
      subscribeToTrip(tripId)
    }

    return () => {
      clearCurrentTrip()
    }
  }, [tripId, subscribeToTrip, clearCurrentTrip])

  const refresh = useCallback(async () => {
    if (tripId) {
      await fetchTrip(tripId)
    }
  }, [tripId, fetchTrip])

  // 檢查使用者權限
  const checkUserPermission = useCallback(async () => {
    if (!tripId || !user?.id) return { isMember: false }
    return checkMembership(tripId, user.id)
  }, [tripId, user?.id])

  return {
    trip: currentTrip,
    loading: currentTripLoading,
    error: currentTripError,
    refresh,
    checkUserPermission,
  }
}

/**
 * 行程操作 Hook
 */
export function useTripActions() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    createTrip: storeCreateTrip,
    updateTrip: storeUpdateTrip,
    deleteTrip: storeDeleteTrip,
    updateDayNote: storeUpdateDayNote,
  } = useTripStore()

  const createTrip = useCallback(
    async (data: Omit<CreateTripData, 'ownerId'>) => {
      if (!user?.id) {
        throw new Error('請先登入')
      }

      const tripId = await storeCreateTrip({
        ...data,
        ownerId: user.id,
      })

      return tripId
    },
    [user?.id, storeCreateTrip]
  )

  const updateTrip = useCallback(
    async (tripId: string, data: UpdateTripData) => {
      await storeUpdateTrip(tripId, data)
    },
    [storeUpdateTrip]
  )

  const deleteTrip = useCallback(
    async (tripId: string) => {
      await storeDeleteTrip(tripId)
      navigate('/dashboard')
    },
    [storeDeleteTrip, navigate]
  )

  const updateDayNote = useCallback(
    async (tripId: string, dayId: string, note: string) => {
      await storeUpdateDayNote(tripId, dayId, note)
    },
    [storeUpdateDayNote]
  )

  return {
    createTrip,
    updateTrip,
    deleteTrip,
    updateDayNote,
  }
}

/**
 * 計算行程統計
 */
export function useTripStats(tripId: string | undefined) {
  const { currentTrip } = useTripStore()

  if (!currentTrip || currentTrip.id !== tripId) {
    return {
      totalDays: 0,
      totalPlaces: 0,
      totalMembers: 0,
    }
  }

  return {
    totalDays: currentTrip.days?.length || 0,
    totalPlaces: 0, // 待實作景點功能後計算
    totalMembers: currentTrip.members?.length || 0,
  }
}

/**
 * 日期格式化工具
 */
export function useDateFormatter() {
  const formatDate = useCallback((date: Date | { toDate: () => Date }) => {
    const d = 'toDate' in date ? date.toDate() : date
    return d.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }, [])

  const formatDateRange = useCallback(
    (startDate: Date | { toDate: () => Date }, endDate: Date | { toDate: () => Date }) => {
      const start = 'toDate' in startDate ? startDate.toDate() : startDate
      const end = 'toDate' in endDate ? endDate.toDate() : endDate
      return `${formatDate(start)} - ${formatDate(end)}`
    },
    [formatDate]
  )

  const formatDayOfWeek = useCallback((date: Date | { toDate: () => Date }) => {
    const d = 'toDate' in date ? date.toDate() : date
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return days[d.getDay()]
  }, [])

  const getDaysDiff = useCallback((startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }, [])

  return {
    formatDate,
    formatDateRange,
    formatDayOfWeek,
    getDaysDiff,
  }
}