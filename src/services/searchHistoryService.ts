import type { SearchHistoryItem } from '@/components/itinerary/AddPlaceModal/types'

const STORAGE_KEY = 'placeSearchHistory'
const MAX_HISTORY_ITEMS = 10

/**
 * 取得搜尋歷史
 */
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const history: SearchHistoryItem[] = JSON.parse(stored)
    // 按時間排序，最新的在前面
    return history.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('讀取搜尋歷史失敗:', error)
    return []
  }
}

/**
 * 儲存搜尋歷史
 */
export function saveToSearchHistory(item: Omit<SearchHistoryItem, 'timestamp'>): void {
  try {
    const history = getSearchHistory()
    
    // 檢查是否已存在（根據名稱和座標）
    const existingIndex = history.findIndex(
      h => h.name === item.name && 
           Math.abs(h.lat - item.lat) < 0.0001 && 
           Math.abs(h.lng - item.lng) < 0.0001
    )
    
    // 移除重複項目
    if (existingIndex >= 0) {
      history.splice(existingIndex, 1)
    }
    
    // 加入新項目（帶時間戳記）
    const newItem: SearchHistoryItem = {
      ...item,
      timestamp: Date.now()
    }
    
    // 保持最多 MAX_HISTORY_ITEMS 個項目
    const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
  } catch (error) {
    console.error('儲存搜尋歷史失敗:', error)
  }
}

/**
 * 清除搜尋歷史
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('清除搜尋歷史失敗:', error)
  }
}

/**
 * 從搜尋歷史中移除特定項目
 */
export function removeFromSearchHistory(name: string): void {
  try {
    const history = getSearchHistory()
    const filtered = history.filter(item => item.name !== name)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('移除搜尋歷史失敗:', error)
  }
}