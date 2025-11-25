// Service Worker for Travel Planner PWA
const CACHE_NAME = 'travel-planner-v1'
const STATIC_CACHE = 'travel-planner-static-v1'
const DYNAMIC_CACHE = 'travel-planner-dynamic-v1'

// 靜態資源快取
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
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
    /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
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
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // 刪除舊版本快取
              return name.startsWith('travel-planner-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
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
  const cache = await caches.open(DYNAMIC_CACHE)
  await cache.addAll(urls)
  console.log('[SW] Cached URLs:', urls)
}

// 清除快取
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName)
    console.log('[SW] Cleared cache:', cacheName)
  } else {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('[SW] Cleared all caches')
  }
}