import { BottomSheetState, useBottomSheet } from '@/hooks/useBottomSheet'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface MapBottomSheetProps {
  children: ReactNode
  mapContent: ReactNode
  defaultState?: BottomSheetState
  className?: string
}

/**
 * 地圖底部彈出元件
 * 在手機版將內容顯示為可拖拉的底部彈出視窗
 * 在桌面版則並排顯示
 */
export default function MapBottomSheet({
  children,
  mapContent,
  defaultState = 'half',
  className = ''
}: MapBottomSheetProps) {
  const isMobile = useIsMobile()
  const {
    state,
    setState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging,
    dragOffset
  } = useBottomSheet({ defaultState })

  // 計算高度百分比
  const getHeightPercentage = () => {
    switch (state) {
      case 'collapsed':
        return 20
      case 'half':
        return 50
      case 'full':
        return 90
      default:
        return 50
    }
  }

  // 桌面版：並排顯示
  if (!isMobile) {
    return (
      <div className={cn('flex gap-6 h-full', className)}>
        {/* 左側內容區 */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        {/* 右側地圖 */}
        <div className="w-2/5 min-w-[400px] sticky top-20 h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-border">
          {mapContent}
        </div>
      </div>
    )
  }

  // 手機版：底部彈出
  const heightPercentage = getHeightPercentage()
  const currentHeight = `${heightPercentage}vh`
  const transform = isDragging ? `translateY(${dragOffset}px)` : 'translateY(0)'

  return (
    <div className={cn('relative h-[calc(100vh-3.5rem-4rem)]', className)}>
      {/* 地圖背景（固定） */}
      <div className="absolute inset-0">
        {mapContent}
      </div>

      {/* 底部彈出內容 */}
      <div
        className={cn(
          'absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-japanese-lg',
          'transition-all duration-300 ease-out',
          isDragging && 'transition-none'
        )}
        style={{
          height: currentHeight,
          transform
        }}
      >
        {/* 拖拉把手 */}
        <div
          className="sticky top-0 z-10 bg-white rounded-t-3xl"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
        >
          <div className="flex items-center justify-center h-8 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* 狀態指示器 */}
          <div className="flex items-center justify-center gap-2 pb-2">
            {(['collapsed', 'half', 'full'] as const).map(s => (
              <button
                key={s}
                onClick={() => setState(s)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  state === s ? 'bg-primary' : 'bg-gray-300'
                )}
                aria-label={`切換至${s === 'collapsed' ? '收合' : s === 'half' ? '半開' : '全開'}狀態`}
              />
            ))}
          </div>
        </div>

        {/* 內容區域 */}
        <div className="h-[calc(100%-4rem)] overflow-y-auto overscroll-contain">
          <div className="px-4 pb-6">
            {children}
          </div>
        </div>
      </div>

      {/* 拖拉時的遮罩，防止誤觸 */}
      {isDragging && (
        <div className="absolute inset-0 z-20" />
      )}
    </div>
  )
}