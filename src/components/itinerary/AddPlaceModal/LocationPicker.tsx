import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { Loader2, MapPin, Navigation } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LocationPickResult } from './types'

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number }
  onLocationSelect: (location: LocationPickResult) => void
  className?: string
}

const libraries: ('places')[] = ['places']

const defaultCenter = {
  lat: 25.0330,  // 台北市中心
  lng: 121.5654
}

export default function LocationPicker({
  initialLocation,
  onLocationSelect,
  className = ''
}: LocationPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [currentLocation, setCurrentLocation] = useState(initialLocation || defaultCenter)
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState('')
  const inputLatRef = useRef<HTMLInputElement>(null)
  const inputLngRef = useRef<HTMLInputElement>(null)

  // 初始化地圖和標記
  useEffect(() => {
    if (isLoaded && map && !marker) {
      const newMarker = new google.maps.Marker({
        position: currentLocation,
        map,
        title: '選擇的位置'
      })
      setMarker(newMarker)
    }
  }, [isLoaded, map, marker, currentLocation])

  // 地圖載入完成
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    
    // 如果有初始位置，移動到該位置
    if (initialLocation) {
      map.panTo(initialLocation)
      map.setZoom(15)
    }
  }, [initialLocation])

  // 地圖點擊事件
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return

    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    
    setCurrentLocation({ lat, lng })
    
    // 移動標記
    if (marker) {
      marker.setPosition(e.latLng)
    }

    // 反向地理編碼
    setLoading(true)
    try {
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({
        location: { lat, lng }
      })

      const result = response.results[0]
      const formattedAddress = result?.formatted_address || ''
      setAddress(formattedAddress)

      // 回傳位置資訊
      onLocationSelect({
        lat,
        lng,
        address: formattedAddress
      })
    } catch (error) {
      console.error('反向地理編碼失敗:', error)
      // 即使失敗也要回傳座標
      onLocationSelect({ lat, lng })
    } finally {
      setLoading(false)
    }
  }, [marker, onLocationSelect])

  // 取得目前位置
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支援地理定位功能')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }
        
        setCurrentLocation(newLocation)
        
        // 移動地圖到目前位置
        if (map) {
          map.panTo(newLocation)
          map.setZoom(16)
        }

        // 移動標記
        if (marker) {
          marker.setPosition(newLocation)
        }

        // 反向地理編碼
        try {
          const geocoder = new google.maps.Geocoder()
          const response = await geocoder.geocode({
            location: newLocation
          })

          const result = response.results[0]
          const formattedAddress = result?.formatted_address || ''
          setAddress(formattedAddress)

          onLocationSelect({
            lat: latitude,
            lng: longitude,
            address: formattedAddress
          })
        } catch (error) {
          console.error('反向地理編碼失敗:', error)
          onLocationSelect({ lat: latitude, lng: longitude })
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        console.error('取得位置失敗:', error)
        alert('無法取得您的位置，請檢查瀏覽器設定')
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }, [map, marker, onLocationSelect])

  // 手動輸入座標
  const handleCoordinateSubmit = useCallback(() => {
    const lat = parseFloat(inputLatRef.current?.value || '')
    const lng = parseFloat(inputLngRef.current?.value || '')

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('請輸入有效的座標')
      return
    }

    const newLocation = { lat, lng }
    setCurrentLocation(newLocation)

    // 移動地圖和標記
    if (map) {
      map.panTo(newLocation)
      map.setZoom(16)
    }

    if (marker) {
      marker.setPosition(newLocation)
    }

    // 反向地理編碼
    setLoading(true)
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: newLocation })
      .then(response => {
        const result = response.results[0]
        const formattedAddress = result?.formatted_address || ''
        setAddress(formattedAddress)

        onLocationSelect({
          lat,
          lng,
          address: formattedAddress
        })
      })
      .catch(error => {
        console.error('反向地理編碼失敗:', error)
        onLocationSelect({ lat, lng })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [map, marker, onLocationSelect])

  if (!isLoaded) {
    return (
      <div className={`bg-white rounded-xl border border-border overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
            <span className="text-foreground-muted">載入地圖...</span>
          </div>
        </div>
      </div>
    )
  }

  const mapOptions: google.maps.MapOptions = {
    zoom: 13,
    center: currentLocation,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 地圖 */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '300px' }}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
          options={mapOptions}
        />
      </div>

      {/* 控制按鈕 */}
      <div className="flex gap-2">
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {loading ? '定位中...' : '使用目前位置'}
        </button>
      </div>

      {/* 座標輸入 */}
      <div className="bg-background-secondary/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <MapPin className="w-4 h-4" />
          <span>手動輸入座標</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-foreground-secondary mb-1">
              緯度 (latitude)
            </label>
            <input
              ref={inputLatRef}
              type="number"
              step="any"
              placeholder="25.0330"
              defaultValue={initialLocation?.lat}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-foreground-secondary mb-1">
              經度 (longitude)
            </label>
            <input
              ref={inputLngRef}
              type="number"
              step="any"
              placeholder="121.5654"
              defaultValue={initialLocation?.lng}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        
        <button
          onClick={handleCoordinateSubmit}
          disabled={loading}
          className="w-full px-4 py-2 bg-background-secondary text-foreground-secondary rounded-lg hover:bg-background-tertiary transition-colors disabled:opacity-50"
        >
          設定座標
        </button>
      </div>

      {/* 地址顯示 */}
      {address && (
        <div className="bg-primary/5 rounded-xl p-3">
          <div className="text-xs text-foreground-secondary mb-1">選取位置</div>
          <div className="text-sm text-foreground">{address}</div>
        </div>
      )}
    </div>
  )
}