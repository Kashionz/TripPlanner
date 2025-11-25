import { create } from 'zustand'
import type { Trip, TripWithDetails } from '@/types/trip'
import * as tripService from '@/services/tripService'

interface TripState {
  // 行程列表
  trips: Trip[]
  tripsLoading: boolean
  tripsError: string | null

  // 當前行程
  currentTrip: TripWithDetails | null
  currentTripLoading: boolean
  currentTripError: string | null

  // 訂閱取消函數
  unsubscribeTrips: (() => void) | null
  unsubscribeCurrentTrip: (() => void) | null
  unsubscribeDays: (() => void) | null
  unsubscribeMembers: (() => void) | null

  // Actions
  fetchUserTrips: (userId: string) => Promise<void>
  subscribeToUserTrips: (userId: string) => void
  fetchTrip: (tripId: string) => Promise<void>
  subscribeToTrip: (tripId: string) => void
  createTrip: (data: tripService.CreateTripData) => Promise<string>
  updateTrip: (tripId: string, data: tripService.UpdateTripData) => Promise<void>
  deleteTrip: (tripId: string) => Promise<void>
  updateDayNote: (tripId: string, dayId: string, note: string) => Promise<void>
  clearCurrentTrip: () => void
  cleanup: () => void
}

export const useTripStore = create<TripState>((set, get) => ({
  // 初始狀態
  trips: [],
  tripsLoading: false,
  tripsError: null,

  currentTrip: null,
  currentTripLoading: false,
  currentTripError: null,

  unsubscribeTrips: null,
  unsubscribeCurrentTrip: null,
  unsubscribeDays: null,
  unsubscribeMembers: null,

  // 取得使用者的行程列表
  fetchUserTrips: async (userId: string) => {
    set({ tripsLoading: true, tripsError: null })
    try {
      const trips = await tripService.getUserTrips(userId)
      set({ trips, tripsLoading: false })
    } catch (error: any) {
      console.error('取得行程列表失敗:', error)
      set({
        tripsError: error.message || '取得行程列表失敗',
        tripsLoading: false,
      })
    }
  },

  // 訂閱使用者行程列表（即時更新）
  subscribeToUserTrips: (userId: string) => {
    // 先取消現有訂閱
    const { unsubscribeTrips } = get()
    if (unsubscribeTrips) {
      unsubscribeTrips()
    }

    set({ tripsLoading: true, tripsError: null })

    const unsubscribe = tripService.subscribeToUserTrips(userId, (trips) => {
      set({ trips, tripsLoading: false })
    })

    set({ unsubscribeTrips: unsubscribe })
  },

  // 取得單一行程詳情
  fetchTrip: async (tripId: string) => {
    set({ currentTripLoading: true, currentTripError: null })
    try {
      const trip = await tripService.getTripWithDetails(tripId)
      if (!trip) {
        throw new Error('行程不存在')
      }
      set({ currentTrip: trip, currentTripLoading: false })
    } catch (error: any) {
      console.error('取得行程失敗:', error)
      set({
        currentTripError: error.message || '取得行程失敗',
        currentTripLoading: false,
      })
    }
  },

  // 訂閱單一行程（即時更新）
  subscribeToTrip: (tripId: string) => {
    const state = get()
    
    // 先取消現有訂閱
    if (state.unsubscribeCurrentTrip) state.unsubscribeCurrentTrip()
    if (state.unsubscribeDays) state.unsubscribeDays()
    if (state.unsubscribeMembers) state.unsubscribeMembers()

    set({ currentTripLoading: true, currentTripError: null })

    // 訂閱行程基本資料
    const unsubscribeTrip = tripService.subscribeToTrip(tripId, (trip) => {
      if (!trip) {
        set({
          currentTrip: null,
          currentTripError: '行程不存在',
          currentTripLoading: false,
        })
        return
      }

      set((state) => ({
        currentTrip: state.currentTrip
          ? { ...state.currentTrip, ...trip }
          : { ...trip, members: [], days: [] },
        currentTripLoading: false,
      }))
    })

    // 訂閱天數
    const unsubscribeDays = tripService.subscribeToTripDays(tripId, (days) => {
      set((state) => ({
        currentTrip: state.currentTrip
          ? { ...state.currentTrip, days }
          : null,
      }))
    })

    // 訂閱成員
    const unsubscribeMembers = tripService.subscribeToTripMembers(tripId, (members) => {
      set((state) => ({
        currentTrip: state.currentTrip
          ? { ...state.currentTrip, members }
          : null,
      }))
    })

    set({
      unsubscribeCurrentTrip: unsubscribeTrip,
      unsubscribeDays,
      unsubscribeMembers,
    })
  },

  // 建立新行程
  createTrip: async (data: tripService.CreateTripData) => {
    try {
      const tripId = await tripService.createTrip(data)
      // 重新取得行程列表
      await get().fetchUserTrips(data.ownerId)
      return tripId
    } catch (error: any) {
      console.error('建立行程失敗:', error)
      throw error
    }
  },

  // 更新行程
  updateTrip: async (tripId: string, data: tripService.UpdateTripData) => {
    try {
      await tripService.updateTrip(tripId, data)
    } catch (error: any) {
      console.error('更新行程失敗:', error)
      throw error
    }
  },

  // 刪除行程
  deleteTrip: async (tripId: string) => {
    try {
      await tripService.deleteTrip(tripId)
      // 從本地狀態移除
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
      }))
    } catch (error: any) {
      console.error('刪除行程失敗:', error)
      throw error
    }
  },

  // 更新天數備註
  updateDayNote: async (tripId: string, dayId: string, note: string) => {
    try {
      await tripService.updateDayNote(tripId, dayId, note)
    } catch (error: any) {
      console.error('更新備註失敗:', error)
      throw error
    }
  },

  // 清除當前行程
  clearCurrentTrip: () => {
    const state = get()
    if (state.unsubscribeCurrentTrip) state.unsubscribeCurrentTrip()
    if (state.unsubscribeDays) state.unsubscribeDays()
    if (state.unsubscribeMembers) state.unsubscribeMembers()

    set({
      currentTrip: null,
      currentTripLoading: false,
      currentTripError: null,
      unsubscribeCurrentTrip: null,
      unsubscribeDays: null,
      unsubscribeMembers: null,
    })
  },

  // 清理所有訂閱
  cleanup: () => {
    const state = get()
    if (state.unsubscribeTrips) state.unsubscribeTrips()
    if (state.unsubscribeCurrentTrip) state.unsubscribeCurrentTrip()
    if (state.unsubscribeDays) state.unsubscribeDays()
    if (state.unsubscribeMembers) state.unsubscribeMembers()

    set({
      trips: [],
      tripsLoading: false,
      tripsError: null,
      currentTrip: null,
      currentTripLoading: false,
      currentTripError: null,
      unsubscribeTrips: null,
      unsubscribeCurrentTrip: null,
      unsubscribeDays: null,
      unsubscribeMembers: null,
    })
  },
}))