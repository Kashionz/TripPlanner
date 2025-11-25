import { useEffect, useState } from 'react'

/**
 * 使用媒體查詢 Hook
 * @param query - CSS 媒體查詢字串
 * @returns 是否符合媒體查詢條件
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 設定初始值
    setMatches(mediaQuery.matches)

    // 監聽變化
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}

/**
 * 判斷是否為手機裝置 (< 1024px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)')
}

/**
 * 判斷是否為平板裝置 (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

/**
 * 判斷是否為桌面裝置 (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * 判斷是否為小螢幕手機 (< 640px)
 */
export function useIsSmallMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}