import type { PopularPlaceItem } from '@/components/itinerary/AddPlaceModal/types'

/**
 * 熱門景點資料
 * 可以根據不同地區/國家提供預設的熱門景點
 */

// 日本熱門景點
export const japanPopularPlaces: PopularPlaceItem[] = [
  {
    name: '東京鐵塔',
    address: '日本東京都港區芝公園4-2-8',
    lat: 35.6586,
    lng: 139.7454,
    category: 'attraction',
    description: '東京地標性建筑，可俯瞰東京全景'
  },
  {
    name: '淺草寺',
    address: '日本東京都台東區淺草2-3-1',
    lat: 35.7148,
    lng: 139.7967,
    category: 'attraction',
    description: '東京最古老的寺廟，雷門是必拍景點'
  },
  {
    name: '清水寺',
    address: '日本京都府京都市東山區清水1-294',
    lat: 34.9949,
    lng: 135.7850,
    category: 'attraction',
    description: '京都最著名的寺廟之一，世界文化遺產'
  },
  {
    name: '伏見稻荷大社',
    address: '日本京都府京都市伏見區深草藪之內町68',
    lat: 34.9671,
    lng: 135.7727,
    category: 'attraction',
    description: '以千本鳥居聞名，登山步道風景優美'
  },
  {
    name: '大阪城',
    address: '日本大阪府大阪市中央區大阪城1-1',
    lat: 34.6873,
    lng: 135.5262,
    category: 'attraction',
    description: '大阪標誌性建築，春季賞櫻勝地'
  },
  {
    name: '奈良公園',
    address: '日本奈良縣奈良市雜司町',
    lat: 34.6851,
    lng: 135.8431,
    category: 'attraction',
    description: '可以與鹿親密接觸的公園'
  },
  {
    name: '築地市場',
    address: '日本東京都中央區築地5-2-1',
    lat: 35.6654,
    lng: 139.7707,
    category: 'restaurant',
    description: '新鮮海鮮市場，壽司愛好者天堂'
  },
  {
    name: '一蘭拉麵',
    address: '日本各地連鎖店',
    lat: 35.6938,
    lng: 139.7034,
    category: 'restaurant',
    description: '著名的豚骨拉麵連鎖店'
  }
]

// 台灣熱門景點
export const taiwanPopularPlaces: PopularPlaceItem[] = [
  {
    name: '台北101',
    address: '台北市信義區信義路五段7號',
    lat: 25.0340,
    lng: 121.5645,
    category: 'attraction',
    description: '台北地標，擁有高空觀景台'
  },
  {
    name: '九份老街',
    address: '新北市瑞芳區基山街',
    lat: 25.1095,
    lng: 121.8451,
    category: 'attraction',
    description: '山城老街，神隱少女取景地'
  },
  {
    name: '日月潭',
    address: '南投縣魚池鄉',
    lat: 23.8571,
    lng: 120.9155,
    category: 'attraction',
    description: '台灣最大天然湖泊'
  },
  {
    name: '士林夜市',
    address: '台北市士林區基河路101號',
    lat: 25.0880,
    lng: 121.5240,
    category: 'restaurant',
    description: '台北最大夜市，美食天堂'
  },
  {
    name: '鼎泰豐',
    address: '台北市大安區信義路二段194號',
    lat: 25.0339,
    lng: 121.5433,
    category: 'restaurant',
    description: '米其林推薦小籠包餐廳'
  },
  {
    name: '故宮博物院',
    address: '台北市士林區至善路二段221號',
    lat: 25.1023,
    lng: 121.5485,
    category: 'attraction',
    description: '世界四大博物館之一'
  }
]

// 韓國熱門景點
export const koreaPopularPlaces: PopularPlaceItem[] = [
  {
    name: '景福宮',
    address: '首爾特別市鍾路區社稷路161',
    lat: 37.5796,
    lng: 126.9770,
    category: 'attraction',
    description: '朝鮮王朝最具代表性的宮殿'
  },
  {
    name: 'N首爾塔',
    address: '首爾特別市龍山區南山公園路105',
    lat: 37.5512,
    lng: 126.9882,
    category: 'attraction',
    description: '首爾地標，可俯瞰首爾全景'
  },
  {
    name: '明洞',
    address: '首爾特別市中區明洞街',
    lat: 37.5635,
    lng: 126.9841,
    category: 'attraction',
    description: '首爾最繁華的購物區'
  },
  {
    name: '弘大',
    address: '首爾特別市麻浦區弘益路',
    lat: 37.5566,
    lng: 126.9240,
    category: 'attraction',
    description: '年輕人聚集的藝術文化街區'
  }
]

/**
 * 根據關鍵字取得相關的熱門景點
 */
export function getPopularPlacesByKeyword(keyword: string): PopularPlaceItem[] {
  const allPlaces = [
    ...japanPopularPlaces,
    ...taiwanPopularPlaces,
    ...koreaPopularPlaces
  ]
  
  if (!keyword.trim()) {
    return allPlaces.slice(0, 6) // 預設顯示前 6 個
  }
  
  const lowerKeyword = keyword.toLowerCase()
  
  return allPlaces.filter(place => 
    place.name.toLowerCase().includes(lowerKeyword) ||
    place.address.toLowerCase().includes(lowerKeyword) ||
    place.description?.toLowerCase().includes(lowerKeyword)
  ).slice(0, 6)
}

/**
 * 根據地區取得熱門景點
 */
export function getPopularPlacesByRegion(region: 'japan' | 'taiwan' | 'korea' | 'all' = 'all'): PopularPlaceItem[] {
  switch (region) {
    case 'japan':
      return japanPopularPlaces
    case 'taiwan':
      return taiwanPopularPlaces
    case 'korea':
      return koreaPopularPlaces
    default:
      return [
        ...japanPopularPlaces.slice(0, 3),
        ...taiwanPopularPlaces.slice(0, 3),
        ...koreaPopularPlaces.slice(0, 2)
      ]
  }
}