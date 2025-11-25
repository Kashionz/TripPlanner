import { detectPlaceCategory, getCategoryColor, getCategoryLabel } from '@/services/placeService'
import type { PlaceCategory } from '@/types/place'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { Loader2, MapPin, Search, Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const libraries: ('places')[] = ['places']

interface PlaceSearchProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
  onClose?: () => void
  placeholder?: string
  className?: string
}

export default function PlaceSearch({
  onPlaceSelect,
  onClose,
  placeholder = '搜尋景點、餐廳、飯店...',
  className = '',
}: PlaceSearchProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [searchValue, setSearchValue] = useState('')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoaded])

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

  if (!isLoaded) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
        <span className="text-foreground-muted">載入搜尋功能...</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
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
            placeholder={placeholder}
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
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-background-secondary transition-colors text-foreground-muted"
          >
            取消
          </button>
        )}
      </div>
    </div>
  )
}

// 搜尋結果預覽元件
interface PlacePreviewProps {
  place: google.maps.places.PlaceResult
  onConfirm: (category: PlaceCategory) => void
  onCancel: () => void
}

export function PlacePreview({ place, onConfirm, onCancel }: PlacePreviewProps) {
  const detectedCategory = detectPlaceCategory(place.types)
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>(detectedCategory)

  const categories: PlaceCategory[] = ['attraction', 'restaurant', 'hotel', 'transport', 'other']

  const photo = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 200 })

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-lg animate-japanese-fade-in">
      {/* 照片 */}
      {photo ? (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={photo}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-background-secondary flex items-center justify-center">
          <MapPin className="w-12 h-12 text-foreground-muted" />
        </div>
      )}

      {/* 資訊 */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-medium text-foreground text-lg mb-1">
            {place.name}
          </h3>
          <p className="text-sm text-foreground-muted flex items-start gap-1">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {place.formatted_address}
          </p>
          {place.rating && (
            <p className="text-sm text-foreground-secondary mt-2 flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {place.rating} ({place.user_ratings_total?.toLocaleString()} 則評論)
            </p>
          )}
        </div>

        {/* 類別選擇 */}
        <div>
          <label className="text-sm text-foreground-secondary mb-2 block">
            選擇類別
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
                }`}
                style={
                  selectedCategory === category
                    ? { backgroundColor: getCategoryColor(category) }
                    : undefined
                }
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-foreground-secondary hover:bg-background-secondary transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(selectedCategory)}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            新增景點
          </button>
        </div>
      </div>
    </div>
  )
}

// 搜尋 Modal
interface PlaceSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onPlaceAdd: (place: google.maps.places.PlaceResult, category: PlaceCategory) => void
}

export function PlaceSearchModal({ isOpen, onClose, onPlaceAdd }: PlaceSearchModalProps) {
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place)
  }

  const handleConfirm = (category: PlaceCategory) => {
    if (selectedPlace) {
      onPlaceAdd(selectedPlace, category)
      setSelectedPlace(null)
      onClose()
    }
  }

  const handleCancel = () => {
    setSelectedPlace(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-start justify-center z-50 p-0 sm:p-4 sm:pt-20 overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mt-0 sm:mt-0">
        {selectedPlace ? (
          <PlacePreview
            place={selectedPlace}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-3 sm:space-y-4 p-4 sm:p-0">
            <PlaceSearch
              onPlaceSelect={handlePlaceSelect}
              onClose={onClose}
            />
            <div className="bg-white rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 text-center">
              <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-foreground-muted mx-auto mb-2 sm:mb-3" />
              <p className="text-sm sm:text-base text-foreground-secondary">
                搜尋並選擇要加入的景點
              </p>
              <p className="text-xs sm:text-sm text-foreground-muted mt-1">
                可以搜尋景點名稱、餐廳、飯店等
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}