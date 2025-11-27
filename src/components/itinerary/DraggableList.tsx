import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import PlaceItem from './PlaceItem'
import type { Place, RouteInfo } from '@/types/place'

interface DraggableListProps {
  places: Place[]
  routes?: RouteInfo[]
  isEditing?: boolean
  selectedPlaceId?: string | null
  onReorder: (newOrder: string[]) => Promise<void>
  onPlaceSelect?: (placeId: string) => void
  onPlaceEdit?: (place: Place) => void
  onPlaceDelete?: (placeId: string) => void
}

export default function DraggableList({
  places,
  routes = [],
  isEditing = false,
  selectedPlaceId,
  onReorder,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
}: DraggableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [items, setItems] = useState(places)

  // 當 places 更新時同步
  if (JSON.stringify(places.map(p => p.id)) !== JSON.stringify(items.map(i => i.id))) {
    setItems(places)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移動 8px 後才開始拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        setItems(newItems)

        // 通知父元件更新順序
        await onReorder(newItems.map((item) => item.id))
      }

      setActiveId(null)
    },
    [items, onReorder]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null

  // 取得該景點到下一個景點的路線
  const getRouteToNext = (index: number): RouteInfo | null => {
    if (index < routes.length) {
      return routes[index]
    }
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((place, index) => (
            <PlaceItem
              key={place.id}
              place={place}
              index={index}
              isEditing={isEditing}
              isSelected={selectedPlaceId === place.id}
              routeToNext={getRouteToNext(index)}
              onSelect={() => onPlaceSelect?.(place.id)}
              onEdit={() => onPlaceEdit?.(place)}
              onDelete={() => onPlaceDelete?.(place.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* 拖拽中的覆蓋層 */}
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90">
            <PlaceItem
              place={activeItem}
              index={items.findIndex((i) => i.id === activeItem.id)}
              isEditing={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// 簡易排序列表（不需要拖拽功能時使用）
interface SimpleListProps {
  places: Place[]
  routes?: RouteInfo[]
  selectedPlaceId?: string | null
  onPlaceSelect?: (placeId: string) => void
}

export function SimpleList({
  places,
  routes = [],
  selectedPlaceId,
  onPlaceSelect,
}: SimpleListProps) {
  const getRouteToNext = (index: number): RouteInfo | null => {
    if (index < routes.length) {
      return routes[index]
    }
    return null
  }

  return (
    <div className="space-y-2">
      {places.map((place, index) => (
        <PlaceItem
          key={place.id}
          place={place}
          index={index}
          isEditing={false}
          isSelected={selectedPlaceId === place.id}
          routeToNext={getRouteToNext(index)}
          onSelect={() => onPlaceSelect?.(place.id)}
        />
      ))}
    </div>
  )
}