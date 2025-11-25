import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Place, PlaceCategory, GooglePlace, RouteInfo } from '@/types/place'

// ==================== Place CRUD ====================

export interface CreatePlaceData {
  dayId: string
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  category: PlaceCategory
  startTime?: string | null
  endTime?: string | null
  duration?: number
  note?: string
  photos?: string[]
}

export interface UpdatePlaceData {
  name?: string
  address?: string
  category?: PlaceCategory
  startTime?: string | null
  endTime?: string | null
  duration?: number
  note?: string
  order?: number
  photos?: string[]
}

/**
 * 新增景點到指定天數
 */
export async function createPlace(
  tripId: string,
  dayId: string,
  data: CreatePlaceData
): Promise<string> {
  // 取得目前該天數的景點數量，設定 order
  const placesRef = collection(db, 'trips', tripId, 'days', dayId, 'places')
  const placesSnap = await getDocs(placesRef)
  const order = placesSnap.size

  const placeData = {
    dayId,
    placeId: data.placeId,
    name: data.name,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    category: data.category,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    duration: data.duration || 60,
    note: data.note || '',
    order,
    photos: data.photos || [],
  }

  const docRef = await addDoc(placesRef, placeData)
  return docRef.id
}

/**
 * 取得指定天數的所有景點
 */
export async function getDayPlaces(tripId: string, dayId: string): Promise<Place[]> {
  const placesRef = collection(db, 'trips', tripId, 'days', dayId, 'places')
  const placesSnap = await getDocs(query(placesRef, orderBy('order')))

  return placesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Place[]
}

/**
 * 取得行程所有天數的所有景點
 */
export async function getTripPlaces(tripId: string): Promise<Map<string, Place[]>> {
  const placesMap = new Map<string, Place[]>()
  
  // 先取得所有天數
  const daysRef = collection(db, 'trips', tripId, 'days')
  const daysSnap = await getDocs(daysRef)

  // 取得每個天數的景點
  for (const dayDoc of daysSnap.docs) {
    const places = await getDayPlaces(tripId, dayDoc.id)
    placesMap.set(dayDoc.id, places)
  }

  return placesMap
}

/**
 * 更新景點
 */
export async function updatePlace(
  tripId: string,
  dayId: string,
  placeId: string,
  data: UpdatePlaceData
): Promise<void> {
  const placeRef = doc(db, 'trips', tripId, 'days', dayId, 'places', placeId)
  await updateDoc(placeRef, data as Record<string, unknown>)
}

/**
 * 刪除景點
 */
export async function deletePlace(
  tripId: string,
  dayId: string,
  placeId: string
): Promise<void> {
  const placeRef = doc(db, 'trips', tripId, 'days', dayId, 'places', placeId)
  await deleteDoc(placeRef)

  // 重新排序剩餘景點
  await reorderPlaces(tripId, dayId)
}

/**
 * 重新排序景點
 */
export async function reorderPlaces(
  tripId: string,
  dayId: string,
  newOrder?: string[]
): Promise<void> {
  const placesRef = collection(db, 'trips', tripId, 'days', dayId, 'places')
  const placesSnap = await getDocs(query(placesRef, orderBy('order')))

  const batch = writeBatch(db)

  if (newOrder) {
    // 按照指定順序重排
    newOrder.forEach((id, index) => {
      const placeRef = doc(placesRef, id)
      batch.update(placeRef, { order: index })
    })
  } else {
    // 按照目前順序重新編號
    placesSnap.docs.forEach((doc, index) => {
      batch.update(doc.ref, { order: index })
    })
  }

  await batch.commit()
}

/**
 * 移動景點到另一天
 */
export async function movePlaceToDay(
  tripId: string,
  sourceDayId: string,
  targetDayId: string,
  placeId: string,
  targetIndex?: number
): Promise<void> {
  // 取得原景點資料
  const sourcePlaceRef = doc(db, 'trips', tripId, 'days', sourceDayId, 'places', placeId)
  const sourcePlaceSnap = await getDoc(sourcePlaceRef)

  if (!sourcePlaceSnap.exists()) {
    throw new Error('Place not found')
  }

  const placeData = sourcePlaceSnap.data()

  // 取得目標天數的景點數量
  const targetPlacesRef = collection(db, 'trips', tripId, 'days', targetDayId, 'places')
  const targetPlacesSnap = await getDocs(targetPlacesRef)
  const targetOrder = targetIndex !== undefined ? targetIndex : targetPlacesSnap.size

  const batch = writeBatch(db)

  // 在目標天數新增景點
  const newPlaceRef = doc(targetPlacesRef)
  batch.set(newPlaceRef, {
    ...placeData,
    dayId: targetDayId,
    order: targetOrder,
  })

  // 刪除原景點
  batch.delete(sourcePlaceRef)

  await batch.commit()

  // 重新排序兩個天數的景點
  await reorderPlaces(tripId, sourceDayId)
  if (targetIndex !== undefined) {
    await reorderPlaces(tripId, targetDayId)
  }
}

// ==================== Real-time Subscriptions ====================

/**
 * 訂閱指定天數的景點變更
 */
export function subscribeToDayPlaces(
  tripId: string,
  dayId: string,
  callback: (places: Place[]) => void
): () => void {
  const placesRef = collection(db, 'trips', tripId, 'days', dayId, 'places')
  const placesQuery = query(placesRef, orderBy('order'))

  return onSnapshot(placesQuery, (snapshot) => {
    const places = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Place[]

    callback(places)
  })
}

// ==================== Google Maps Utilities ====================

/**
 * 從 Google Place 建立景點資料
 */
export function createPlaceFromGoogle(
  googlePlace: google.maps.places.PlaceResult,
  category: PlaceCategory = 'attraction'
): Omit<CreatePlaceData, 'dayId'> {
  const lat = googlePlace.geometry?.location?.lat() || 0
  const lng = googlePlace.geometry?.location?.lng() || 0
  
  const photos = googlePlace.photos?.slice(0, 5).map(photo => 
    photo.getUrl({ maxWidth: 400, maxHeight: 300 })
  ) || []

  return {
    placeId: googlePlace.place_id || '',
    name: googlePlace.name || '',
    address: googlePlace.formatted_address || googlePlace.vicinity || '',
    lat,
    lng,
    category,
    duration: 60,
    photos,
  }
}

/**
 * 判斷景點類別
 */
export function detectPlaceCategory(types: string[] | undefined): PlaceCategory {
  if (!types) return 'other'

  const typeMap: Record<string, PlaceCategory> = {
    lodging: 'hotel',
    hotel: 'hotel',
    restaurant: 'restaurant',
    food: 'restaurant',
    cafe: 'restaurant',
    bar: 'restaurant',
    bakery: 'restaurant',
    transit_station: 'transport',
    train_station: 'transport',
    bus_station: 'transport',
    airport: 'transport',
    subway_station: 'transport',
    tourist_attraction: 'attraction',
    museum: 'attraction',
    park: 'attraction',
    point_of_interest: 'attraction',
    amusement_park: 'attraction',
    art_gallery: 'attraction',
  }

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type]
    }
  }

  return 'other'
}

/**
 * 取得類別顯示名稱
 */
export function getCategoryLabel(category: PlaceCategory): string {
  const labels: Record<PlaceCategory, string> = {
    attraction: '景點',
    restaurant: '餐廳',
    hotel: '住宿',
    transport: '交通',
    other: '其他',
  }
  return labels[category]
}

/**
 * 取得類別圖示顏色
 */
export function getCategoryColor(category: PlaceCategory): string {
  const colors: Record<PlaceCategory, string> = {
    attraction: '#5B7B7A', // primary
    restaurant: '#C4A35A', // accent
    hotel: '#8B9D83', // secondary
    transport: '#6B7280', // gray
    other: '#9CA3AF', // light gray
  }
  return colors[category]
}

// ==================== Route Calculation ====================

let directionsService: google.maps.DirectionsService | null = null

/**
 * 初始化路線服務
 */
export function initDirectionsService(): void {
  if (!directionsService && typeof google !== 'undefined') {
    directionsService = new google.maps.DirectionsService()
  }
}

/**
 * 計算兩點之間的路線
 */
export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
): Promise<RouteInfo | null> {
  if (!directionsService) {
    initDirectionsService()
  }

  if (!directionsService) {
    console.error('Directions service not initialized')
    return null
  }

  try {
    const result = await directionsService.route({
      origin,
      destination,
      travelMode,
    })

    const leg = result.routes[0]?.legs[0]
    if (!leg) return null

    return {
      origin,
      destination,
      distance: leg.distance?.text || '',
      duration: leg.duration?.text || '',
      durationValue: leg.duration?.value || 0,
    }
  } catch (error) {
    console.error('Route calculation failed:', error)
    return null
  }
}

/**
 * 計算多個景點之間的路線
 */
export async function calculateRoutes(
  places: Place[],
  travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = []

  for (let i = 0; i < places.length - 1; i++) {
    const origin = { lat: places[i].lat, lng: places[i].lng }
    const destination = { lat: places[i + 1].lat, lng: places[i + 1].lng }

    const route = await calculateRoute(origin, destination, travelMode)
    if (route) {
      routes.push(route)
    }
  }

  return routes
}

/**
 * 格式化持續時間
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分鐘`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} 小時 ${mins} 分鐘` : `${hours} 小時`
}

/**
 * 格式化時間 (HH:mm)
 */
export function formatTime(time: string | null): string {
  if (!time) return ''
  return time
}

/**
 * 計算結束時間
 */
export function calculateEndTime(startTime: string | null, duration: number): string | null {
  if (!startTime) return null

  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration

  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}