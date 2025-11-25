import { useState } from 'react'
import {
  MapPin,
  Clock,
  GripVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Navigation,
} from 'lucide-react'
import type { Place, RouteInfo } from '@/types/place'
import { getCategoryLabel, getCategoryColor, formatDuration } from '@/services/placeService'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PlaceItemProps {
  place: Place
  index: number
  isEditing?: boolean
  isSelected?: boolean
  routeToNext?: RouteInfo | null
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function PlaceItem({
  place,
  index,
  isEditing = false,
  isSelected = false,
  routeToNext,
  onSelect,
  onEdit,
  onDelete,
}: PlaceItemProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id, disabled: !isEditing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const categoryColor = getCategoryColor(place.category)

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`bg-white rounded-xl border transition-all duration-200 ${
          isSelected
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border hover:border-primary/30'
        } ${isDragging ? 'shadow-lg' : ''}`}
      >
        <div
          className="flex items-start gap-3 p-3 cursor-pointer"
          onClick={onSelect}
        >
          {/* 拖拽手把 */}
          {isEditing && (
            <button
              {...attributes}
              {...listeners}
              className="mt-1 p-1 rounded hover:bg-background-secondary cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4 text-foreground-muted" />
            </button>
          )}

          {/* 序號 */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mt-0.5"
            style={{ backgroundColor: categoryColor }}
          >
            {index + 1}
          </div>

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {place.name}
                </h4>
                <p className="text-sm text-foreground-muted truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {place.address}
                </p>
              </div>

              {/* 時間 */}
              {(place.startTime || place.duration) && (
                <div className="text-right flex-shrink-0">
                  {place.startTime && (
                    <div className="text-sm font-medium text-foreground">
                      {place.startTime}
                    </div>
                  )}
                  <div className="text-xs text-foreground-muted flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {formatDuration(place.duration)}
                  </div>
                </div>
              )}
            </div>

            {/* 標籤 */}
            <div className="flex items-center gap-2 mt-2">
              <span
                className="px-2 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: categoryColor }}
              >
                {getCategoryLabel(place.category)}
              </span>

              {place.note && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDetails(!showDetails)
                  }}
                  className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
                >
                  備註
                  {showDetails ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 操作選單 */}
          {isEditing && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1 rounded hover:bg-background-secondary transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-foreground-muted" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-border py-1 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        onEdit?.()
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-foreground-secondary hover:bg-background-secondary flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      編輯
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        onDelete?.()
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      刪除
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 備註詳情 */}
        {showDetails && place.note && (
          <div className="px-3 pb-3 pt-0">
            <div className="bg-background-secondary/50 rounded-lg p-3 text-sm text-foreground-secondary">
              {place.note}
            </div>
          </div>
        )}

        {/* 照片 */}
        {place.photos && place.photos.length > 0 && showDetails && (
          <div className="px-3 pb-3">
            <div className="flex gap-2 overflow-x-auto">
              {place.photos.slice(0, 3).map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`${place.name} ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 路線資訊 */}
      {routeToNext && (
        <div className="flex items-center gap-2 py-2 px-4 text-xs text-foreground-muted">
          <div className="flex-1 border-t border-dashed border-border" />
          <Navigation className="w-3 h-3" />
          <span>{routeToNext.distance}</span>
          <span>·</span>
          <span>{routeToNext.duration}</span>
          <div className="flex-1 border-t border-dashed border-border" />
        </div>
      )}
    </div>
  )
}

// 空景點項目（用於提示新增）
interface EmptyPlaceItemProps {
  onClick?: () => void
}

export function EmptyPlaceItem({ onClick }: EmptyPlaceItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 border-2 border-dashed border-border rounded-xl text-foreground-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
    >
      <MapPin className="w-6 h-6 mx-auto mb-2" />
      <p>新增第一個景點</p>
    </button>
  )
}