import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { Search, Loader2, MapPin, Star, Clock, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { getSearchHistory } from '@/services/searchHistoryService'
import { getPopularPlacesByRegion } from '@/data/popularPlaces'
import type { PopularPlaceItem } from './types'

interface SearchSectionProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
  onQuickPlaceSelect: (place: PopularPlaceItem) => void
  onSwitchToManual: () => void
  className?: string
}

const libraries: ('places')[] = ['places']

export default function SearchSection({
  onPlaceSelect,
  onQuickPlaceSelect,
  onSwitchToManual,
  className = ''
}: SearchSectionProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [searchValue, setSearchValue] = useState('')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete)
  }, [])

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place && place.geometry) {
        onPlaceSelect(place)
        setSearchValue('')
      }
    }
  }, [autocomplete, onPlaceSelect])

  const handleClear = () => {
    setSearchValue('')
    inputRef.current?.focus()
  }

  // 取得搜尋歷史和熱門景點
  const searchHistory = getSearchHistory().slice(0, 3)
  const popularPlaces = getPopularPlacesByRegion('all').slice(0, 6)

  if (!isLoaded) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
        <span className="text-foreground-muted">載入搜尋功能...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 搜尋列 */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <Search className="w-5 h-5 text-foreground-muted flex-shrink-0" />
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              types: ['establishment'],
              fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'types'],
            }}
            className="flex-1"
          >
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜尋景點、餐廳、飯店..."
              className="w-full bg-transparent text-foreground placeholder:text-foreground-muted focus:outline-none"
            />
          </Autocomplete>
          {searchValue && (
            <button
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-background-secondary transition-colors"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          )}
        </div>
      </div>

      {/* 快速存取區 */}
      <div className="space-y-4">
        {/* 搜尋歷史 */}
        {searchHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground-secondary mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              最近搜尋
            </h3>
            <div className="space-y-2">
              {searchHistory.map((item, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => onQuickPlaceSelect({
                    name: item.name,
                    address: item.address,
                    lat: item.lat,
                    lng: item.lng,
                    category: 'attraction'
                  })}
                  className="w-full text-left p-3 bg-white rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-foreground-muted flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-foreground-muted truncate">
                        {item.address}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 熱門景點 */}
        <div>
          <h3 className="text-sm font-medium text-foreground-secondary mb-2 flex items-center gap-2">
            <Star className="w-4 h-4" />
            熱門景點
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {popularPlaces.map((place, index) => (
              <button
                key={`popular-${index}`}
                onClick={() => onQuickPlaceSelect(place)}
                className="w-full text-left p-3 bg-white rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {place.name}
                    </p>
                    <p className="text-xs text-foreground-muted truncate">
                      {place.address}
                    </p>
                    {place.description && (
                      <p className="text-xs text-foreground-secondary mt-1 line-clamp-2">
                        {place.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 手動輸入提示 */}
        <div className="bg-background-secondary/50 rounded-xl p-4 text-center">
          <MapPin className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
          <p className="text-sm text-foreground-secondary mb-2">
            找不到想要的景點？
          </p>
          <button
            onClick={onSwitchToManual}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            點此手動輸入
          </button>
        </div>
      </div>
    </div>
  )
}