// Service Worker for Travel Planner PWA
const VERSION = '1.1.0'
const CACHE_NAME = `travel-planner-v${VERSION}`
const STATIC_CACHE = `travel-planner-static-v${VERSION}`
const DYNAMIC_CACHE = `travel-planner-dynamic-v${VERSION}`
const IMAGE_CACHE = `travel-planner-images-v${VERSION}`

// 快取大小限制
const CACHE_LIMITS = {
  images: 50,      // 圖片快取上限
  dynamic: 100,    // 動態資源快取上限
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7天（毫秒）
}

// 靜態資源快取
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/offline.html',
]

// 網路請求策略
const CACHE_STRATEGIES = {
  // 網路優先 (API 請求)
  networkFirst: [
    /\/api\//,
    /firestore\.googleapis\.com/,
    /firebase/,
  ],
  // 快取優先 (靜態資源)
  cacheFirst: [
    /\.(js|css|woff2?|ttf|eot)$/,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
  ],
  // 圖片快取策略
  imageCache: [
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  ],
  // 只用快取 (離線資源)
  cacheOnly: [
    /\/offline\.html$/,
  ],
}

// 安裝事件
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Skip waiting')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error)
      })
  )
})

// 啟動事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  
  event.waitUntil(
    Promise.all([
      // 清理舊快取
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // 刪除舊版本快取
              return name.startsWith('travel-planner-') &&
                     name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE &&
                     name !== IMAGE_CACHE
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      }),
      // 清理過期快取
      cleanExpiredCache(),
    ]).then(() => {
      console.log('[SW] Claiming clients')
      return self.clients.claim()
    })
  )
})

// 請求攔截
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只處理 HTTP/HTTPS 請求
  if (!request.url.startsWith('http')) {
    return
  }

  // 跳過 Chrome 擴充功能請求
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // 跳過 Firebase Storage 請求（避免 CORS 問題）
  if (url.hostname.includes('firebasestorage.googleapis.com')) {
    return
  }

  // 跳過 POST/PUT/DELETE 請求（這些不應被快取）
  if (request.method !== 'GET') {
    return
  }

  // 根據 URL 選擇快取策略
  if (matchesPattern(url.href, CACHE_STRATEGIES.networkFirst)) {
    event.respondWith(networkFirst(request))
  } else if (matchesPattern(url.href, CACHE_STRATEGIES.imageCache)) {
    event.respondWith(imageCache(request))
  } else if (matchesPattern(url.href, CACHE_STRATEGIES.cacheFirst)) {
    event.respondWith(cacheFirst(request))
  } else if (matchesPattern(url.href, CACHE_STRATEGIES.cacheOnly)) {
    event.respondWith(cacheOnly(request))
  } else {
    // 預設使用網路優先
    event.respondWith(networkFirst(request))
  }
})

// 網路優先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    // 成功取得網路回應，快取起來
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // 網路失敗，嘗試從快取取得
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache (network failed):', request.url)
      return cachedResponse
    }
    
    // 如果是頁面請求，返回離線頁面
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    throw error
  }
}

// 快取優先策略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // 背景更新快取
    updateCache(request)
    return cachedResponse
  }
  
  // 快取沒有，從網路取得
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('[SW] Cache first failed:', request.url, error)
    throw error
  }
}

// 只用快取策略
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  return new Response('Resource not available offline', {
    status: 503,
    statusText: 'Service Unavailable',
  })
}

// 圖片快取策略（帶大小限制）
async function imageCache(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // 檢查快取時間
    const cacheTime = await getCacheTime(request)
    if (cacheTime && Date.now() - cacheTime < CACHE_LIMITS.maxAge) {
      return cachedResponse
    }
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE)
      
      // 限制快取大小
      await limitCacheSize(IMAGE_CACHE, CACHE_LIMITS.images)
      
      // 儲存快取時間
      await cache.put(request, networkResponse.clone())
      await setCacheTime(request, Date.now())
    }
    
    return networkResponse
  } catch (error) {
    // 網路失敗，返回快取（即使過期）
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// 限制快取大小
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxItems) {
    // 刪除最舊的項目
    const deleteCount = keys.length - maxItems
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i])
    }
    console.log(`[SW] Trimmed ${deleteCount} items from ${cacheName}`)
  }
}

// 儲存快取時間（使用 Cache API 的 metadata）
async function setCacheTime(request, time) {
  const url = new URL(request.url)
  const timeKey = `${url.pathname}-cache-time`
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    await cache.put(
      timeKey,
      new Response(time.toString(), {
        headers: { 'Content-Type': 'text/plain' }
      })
    )
  } catch (error) {
    console.error('[SW] Failed to set cache time:', error)
  }
}

// 取得快取時間
async function getCacheTime(request) {
  const url = new URL(request.url)
  const timeKey = `${url.pathname}-cache-time`
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const response = await cache.match(timeKey)
    
    if (response) {
      const timeStr = await response.text()
      return parseInt(timeStr, 10)
    }
  } catch (error) {
    console.error('[SW] Failed to get cache time:', error)
  }
  
  return null
}

// 清理過期快取
async function cleanExpiredCache() {
  const cacheNames = [DYNAMIC_CACHE, IMAGE_CACHE]
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      
      for (const request of keys) {
        const cacheTime = await getCacheTime(request)
        
        if (cacheTime && Date.now() - cacheTime > CACHE_LIMITS.maxAge) {
          await cache.delete(request)
          console.log('[SW] Deleted expired cache:', request.url)
        }
      }
    } catch (error) {
      console.error('[SW] Failed to clean cache:', error)
    }
  }
}

// 背景更新快取
async function updateCache(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      await cache.put(request, networkResponse)
      console.log('[SW] Cache updated:', request.url)
    }
  } catch (error) {
    // 背景更新失敗不影響使用
    console.log('[SW] Background cache update failed:', request.url)
  }
}

// 檢查 URL 是否符合模式
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url))
}

// 推播通知事件
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const { title, body, icon, badge, tag, data: notificationData } = data
  
  const options = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag,
    data: notificationData,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '開啟' },
      { action: 'close', title: '關閉' },
    ],
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// 通知點擊事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // 如果已有視窗，聚焦它
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // 否則開啟新視窗
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// 背景同步事件
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-trips') {
    event.waitUntil(syncTrips())
  }
})

// 同步行程資料
async function syncTrips() {
  // 從 IndexedDB 取得待同步的資料
  // 這裡需要與主應用程式整合
  console.log('[SW] Syncing trips...')
}

// 訊息處理
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'CACHE_URLS':
      cacheUrls(data.urls)
      break
    case 'CLEAR_CACHE':
      clearCache(data.cacheName)
      break
  }
})

// 快取指定 URL
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    
    // 批次快取，避免一次快取太多
    const batchSize = 10
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      await Promise.all(
        batch.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Failed to cache:', url, err)
          )
        )
      )
    }
    
    console.log('[SW] Cached URLs:', urls.length)
  } catch (error) {
    console.error('[SW] Cache URLs failed:', error)
  }
}

// 清除快取
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName)
      console.log('[SW] Cleared cache:', cacheName)
    } else {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('[SW] Cleared all caches')
    }
  } catch (error) {
    console.error('[SW] Clear cache failed:', error)
  }
}

// 定期清理過期快取（每小時）
setInterval(() => {
  cleanExpiredCache()
}, 60 * 60 * 1000)