import { useCallback, useEffect, useRef, useState } from 'react'

export type BottomSheetState = 'collapsed' | 'half' | 'full'

interface UseBottomSheetOptions {
  defaultState?: BottomSheetState
  onStateChange?: (state: BottomSheetState) => void
}

interface UseBottomSheetReturn {
  state: BottomSheetState
  setState: (state: BottomSheetState) => void
  handleDragStart: (e: React.TouchEvent | React.MouseEvent) => void
  handleDragMove: (e: React.TouchEvent | React.MouseEvent) => void
  handleDragEnd: () => void
  isDragging: boolean
  dragOffset: number
}

export function useBottomSheet({
  defaultState = 'half',
  onStateChange
}: UseBottomSheetOptions = {}): UseBottomSheetReturn {
  const [state, setState] = useState<BottomSheetState>(defaultState)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleStateChange = useCallback((newState: BottomSheetState) => {
    setState(newState)
    setDragOffset(0)
    onStateChange?.(newState)
  }, [onStateChange])

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true)
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startY.current = clientY
    currentY.current = clientY
  }, [])

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = clientY - startY.current
    currentY.current = clientY
    
    // 限制拖拉範圍，避免拖出螢幕
    setDragOffset(Math.max(-200, Math.min(200, deltaY)))
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)
    
    const deltaY = currentY.current - startY.current
    const velocity = Math.abs(deltaY)

    // 根據拖拉距離和速度決定新狀態
    if (velocity > 50) {
      // 快速滑動
      if (deltaY > 0) {
        // 向下滑
        if (state === 'full') {
          handleStateChange('half')
        } else if (state === 'half') {
          handleStateChange('collapsed')
        }
      } else {
        // 向上滑
        if (state === 'collapsed') {
          handleStateChange('half')
        } else if (state === 'half') {
          handleStateChange('full')
        }
      }
    } else {
      // 慢速拖拉，根據距離決定
      if (deltaY > 100) {
        // 向下拖超過 100px
        if (state === 'full') {
          handleStateChange('half')
        } else if (state === 'half') {
          handleStateChange('collapsed')
        }
      } else if (deltaY < -100) {
        // 向上拖超過 100px
        if (state === 'collapsed') {
          handleStateChange('half')
        } else if (state === 'half') {
          handleStateChange('full')
        }
      } else {
        // 拖拉距離不足，回到原狀態
        setDragOffset(0)
      }
    }
  }, [isDragging, state, handleStateChange])

  // 清理拖拉狀態
  useEffect(() => {
    if (!isDragging) {
      setDragOffset(0)
    }
  }, [isDragging])

  return {
    state,
    setState: handleStateChange,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging,
    dragOffset
  }
}