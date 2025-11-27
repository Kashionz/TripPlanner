import { formatDuration, getCategoryColor, getCategoryLabel } from '@/services/placeService'
import type { PlaceCategory } from '@/types/place'
import type { FormErrors } from './types'
import { Clock, FileText, MapPin, Star, X } from 'lucide-react'
import { useState } from 'react'

interface DetailFormProps {
  name: string
  address: string
  lat: number
  lng: number
  category: PlaceCategory
  startTime: string | null
  duration: number
  note: string
  photos?: string[]
  rating?: number
  ratingTotal?: number
  errors: FormErrors
  onFieldChange: <K extends 'name' | 'address' | 'category' | 'startTime' | 'duration' | 'note'>(
    field: K,
    value: K extends 'category' ? PlaceCategory : string | number
  ) => void
  onRemovePhoto?: (index: number) => void
  className?: string
  isManualMode?: boolean  // 新增：是否為手動模式
}

const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360]

export default function DetailForm({
  name,
  address,
  lat,
  lng,
  category,
  startTime,
  duration,
  note,
  photos,
  rating,
  ratingTotal,
  errors,
  onFieldChange,
  onRemovePhoto,
  className = '',
  isManualMode = false
}: DetailFormProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  const categories: PlaceCategory[] = ['attraction', 'restaurant', 'hotel', 'transport', 'other']

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 基本資訊卡片 */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* 照片展示 */}
        {photos && photos.length > 0 && (
          <div className="relative">
            <div className="aspect-video bg-background-secondary">
              <img
                src={photos[0]}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            {photos.length > 1 && (
              <button
                onClick={() => setShowAllPhotos(!showAllPhotos)}
                className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded-lg"
              >
                {showAllPhotos ? '收起' : `+${photos.length - 1} 張`}
              </button>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* 景點名稱 */}
          <div>
            <label className="block text-sm text-foreground-secondary mb-2">
              景點名稱 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="輸入景點名稱"
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-primary ${
                errors.name ? 'border-red-300' : 'border-border'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* 地址 */}
          <div>
            <label className="block text-sm text-foreground-secondary mb-2">
              地址 {isManualMode && '*'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => onFieldChange('address', e.target.value)}
              placeholder={isManualMode ? "輸入地址" : "輸入地址（選填）"}
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-primary ${
                errors.address ? 'border-red-300' : 'border-border'
              }`}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          {/* 座標顯示 - 只在非手動模式或已有座標時顯示 */}
          {!isManualMode && lat !== 0 && lng !== 0 && (
            <div className="text-xs text-foreground-muted">
              座標: {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
          )}

          {/* 評分顯示 */}
          {rating && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-medium">{rating}</span>
              {ratingTotal && (
                <span className="text-foreground-muted">({ratingTotal.toLocaleString()} 則評論)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 類別選擇 */}
      <div className="bg-white rounded-xl border border-border p-4">
        <label className="block text-sm text-foreground-secondary mb-3">
          類別
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onFieldChange('category', cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? 'text-white'
                  : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
              }`}
              style={
                category === cat
                  ? { backgroundColor: getCategoryColor(cat) }
                  : undefined
              }
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* 時間設定 */}
      <div className="bg-white rounded-xl border border-border p-4">
        <label className="block text-sm text-foreground-secondary mb-3">
          <Clock className="w-4 h-4 inline mr-1" />
          時間安排
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-foreground-secondary mb-2">
              開始時間
            </label>
            <input
              type="time"
              value={startTime || ''}
              onChange={(e) => onFieldChange('startTime', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-foreground-secondary mb-2">
              停留時間
            </label>
            <select
              value={duration}
              onChange={(e) => onFieldChange('duration', Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              {durationOptions.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 預計結束時間 */}
        {startTime && (
          <div className="mt-3 text-sm text-foreground-muted">
            預計結束時間：{calculateEndTime(startTime, duration)}
          </div>
        )}
      </div>

      {/* 備註 */}
      <div className="bg-white rounded-xl border border-border p-4">
        <label className="block text-sm text-foreground-secondary mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          備註
        </label>
        <textarea
          value={note}
          onChange={(e) => onFieldChange('note', e.target.value)}
          placeholder="新增備註..."
          rows={3}
          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {/* 照片管理 */}
      {photos && photos.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <label className="block text-sm text-foreground-secondary mb-3">
            照片 ({photos.length})
          </label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo}
                  alt={`照片 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {onRemovePhoto && (
                  <button
                    onClick={() => onRemovePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 計算結束時間
 */
function calculateEndTime(startTime: string, duration: number): string {
  if (!startTime) return ''
  
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}