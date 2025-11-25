import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <span className="text-2xl font-light text-white">TripPlanner</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-light text-white leading-relaxed">
            探索你的<br />
            下一趟旅程
          </h1>
          <p className="text-white/80 text-lg">
            與朋友一起規劃、即時協作、輕鬆出發
          </p>
        </div>

        <div className="text-white/60 text-sm">
          © 2024 TripPlanner. All rights reserved.
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-light text-foreground">TripPlanner</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}