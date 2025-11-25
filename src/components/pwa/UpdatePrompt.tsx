import { RefreshCw, X } from 'lucide-react'
import { useUpdatePrompt } from '@/hooks/usePWA'

export default function UpdatePrompt() {
  const { hasUpdate, update, dismiss } = useUpdatePrompt()

  if (!hasUpdate) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-japanese-slide-up">
      <div className="bg-white rounded-2xl shadow-lg border border-border p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">有新版本可用</h3>
            <p className="text-sm text-foreground-muted mt-1">
              Travel Planner 已更新，重新整理以使用最新版本。
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={update}
                className="px-4 py-2 bg-accent text-white text-sm rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                立即更新
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2 text-foreground-muted text-sm hover:text-foreground transition-colors"
              >
                稍後
              </button>
            </div>
          </div>
          
          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>
      </div>
    </div>
  )
}