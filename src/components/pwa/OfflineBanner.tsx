import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/usePWA'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>您目前離線中。部分功能可能無法使用。</span>
      </div>
    </div>
  )
}