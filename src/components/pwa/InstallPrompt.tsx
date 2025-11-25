import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export default function InstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)

  // 檢查是否已經被關閉過
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('pwa-install-dismissed')
    if (dismissedUntil) {
      const until = new Date(dismissedUntil)
      if (until > new Date()) {
        setDismissed(true)
      }
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    // 7 天後再顯示
    const until = new Date()
    until.setDate(until.getDate() + 7)
    localStorage.setItem('pwa-install-dismissed', until.toISOString())
  }

  const handleInstall = async () => {
    setInstalling(true)
    try {
      await install()
    } finally {
      setInstalling(false)
    }
  }

  // 不顯示的條件
  if (!isInstallable || isInstalled || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-japanese-slide-up">
      <div className="bg-white rounded-2xl shadow-lg border border-border p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Download className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">安裝應用程式</h3>
            <p className="text-sm text-foreground-muted mt-1">
              將 Travel Planner 安裝到您的裝置，享受更好的體驗。
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {installing ? '安裝中...' : '立即安裝'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-foreground-muted text-sm hover:text-foreground transition-colors"
              >
                稍後再說
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>
      </div>
    </div>
  )
}