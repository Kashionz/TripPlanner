import { useState, useCallback, useEffect, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api'
import { Loader2, MapPin } from 'lucide-react'
import type { Place } from '@/types/place'
import { getCategoryColor, getCategoryLabel } from '@/services/placeService'

const libraries: ('places' | 'geometry' | 'drawing')[] = ['places']

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

// 日系簡約風地圖樣式
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'geometry.fill',
    stylers: [{ saturation: -20 }, { lightness: 10 }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c8d7d4' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e5e5e0' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#d4e4d4' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'simplified' }],
  },
]

const defaultCenter = {
  lat: 25.033, // 台北
  lng: 121.5654,
}

interface TripMapProps {
  places: Place[]
  selectedPlaceId?: string | null
  onPlaceSelect?: (placeId: string | null) => void
  showRoutes?: boolean
  className?: string
}

export default function TripMap({
  places,
  selectedPlaceId,
  onPlaceSelect,
  showRoutes = true,
  className = '',
}: TripMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null)

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // 計算地圖中心和邊界
  const { center, bounds } = useMemo(() => {
    if (places.length === 0) {
      return { center: defaultCenter, bounds: null }
    }

    const lats = places.map(p => p.lat)
    const lngs = places.map(p => p.lng)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const center = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    }

    const bounds = new google.maps.LatLngBounds(
      { lat: minLat, lng: minLng },
      { lat: maxLat, lng: maxLng }
    )

    return { center, bounds }
  }, [places])

  // 調整地圖邊界
  useEffect(() => {
    if (map && bounds && places.length > 1) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
    } else if (map && places.length === 1) {
      map.setCenter({ lat: places[0].lat, lng: places[0].lng })
      map.setZoom(15)
    }
  }, [map, bounds, places])

  // 選中景點時平移到該位置
  useEffect(() => {
    if (map && selectedPlaceId) {
      const place = places.find(p => p.id === selectedPlaceId)
      if (place) {
        map.panTo({ lat: place.lat, lng: place.lng })
        setActiveInfoWindow(selectedPlaceId)
      }
    }
  }, [map, selectedPlaceId, places])

  const handleMarkerClick = (placeId: string) => {
    setActiveInfoWindow(placeId)
    onPlaceSelect?.(placeId)
  }

  // 路線座標
  const routePath = useMemo(() => {
    return places.map(p => ({ lat: p.lat, lng: p.lng }))
  }, [places])

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-background-secondary ${className}`}>
        <div className="text-center text-foreground-muted">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>地圖載入失敗</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-background-secondary ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={places.length === 0 ? 12 : undefined}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* 路線 */}
        {showRoutes && places.length > 1 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#5B7B7A',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        )}

        {/* 景點標記 */}
        {places.map((place, index) => (
          <Marker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            label={{
              text: String(index + 1),
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getCategoryColor(place.category),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 14,
            }}
            onClick={() => handleMarkerClick(place.id)}
          />
        ))}

        {/* InfoWindow */}
        {activeInfoWindow && (
          <PlaceInfoWindow
            place={places.find(p => p.id === activeInfoWindow)!}
            onClose={() => setActiveInfoWindow(null)}
          />
        )}
      </GoogleMap>

      {/* 圖例 */}
      {places.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1.5 shadow-sm border border-border">
          <div className="font-medium text-foreground mb-2">圖例</div>
          {(['attraction', 'restaurant', 'hotel', 'transport'] as const).map(category => (
            <div key={category} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getCategoryColor(category) }}
              />
              <span className="text-foreground-secondary">{getCategoryLabel(category)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// InfoWindow 元件
interface PlaceInfoWindowProps {
  place: Place
  onClose: () => void
}

function PlaceInfoWindow({ place, onClose }: PlaceInfoWindowProps) {
  if (!place) return null

  return (
    <InfoWindow
      position={{ lat: place.lat, lng: place.lng }}
      onCloseClick={onClose}
    >
      <div className="p-2 max-w-[200px]">
        <h4 className="font-medium text-gray-900 mb-1">{place.name}</h4>
        <p className="text-xs text-gray-500 mb-2">{place.address}</p>
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs text-white"
          style={{ backgroundColor: getCategoryColor(place.category) }}
        >
          {getCategoryLabel(place.category)}
        </span>
        {place.startTime && (
          <p className="text-xs text-gray-600 mt-2">
            🕐 {place.startTime}
            {place.endTime && ` - ${place.endTime}`}
          </p>
        )}
      </div>
    </InfoWindow>
  )
}