import { Link } from 'react-router-dom'
import { Home, ArrowLeft, MapPin } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <MapPin className="w-12 h-12 text-primary" />
        </div>

        {/* Text */}
        <h1 className="text-6xl font-light text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-light text-foreground mb-2">
          找不到頁面
        </h2>
        <p className="text-foreground-secondary mb-8">
          您要找的頁面可能已被移除、名稱已更改，或暫時無法使用。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            <Home className="w-5 h-5" />
            回到首頁
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground-secondary rounded-xl font-medium hover:bg-background-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上頁
          </button>
        </div>
      </div>
    </div>
  )
}