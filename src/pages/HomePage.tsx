import { useAuthStore } from '@/stores/authStore'
import { ArrowRight, Calendar, MapPin, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: <MapPin className="w-8 h-8" />,
    title: '行程規劃',
    description: '拖拉排序景點、整合 Google Maps、自動計算交通時間',
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: '多人協作',
    description: '邀請好友加入、即時同步編輯、留言討論',
  },
  {
    icon: <Wallet className="w-8 h-8" />,
    title: '費用分攤',
    description: '記錄旅途開支、自動計算分攤、清晰明瞭',
  },
  {
    icon: <Calendar className="w-8 h-8" />,
    title: '行程匯出',
    description: '匯出 PDF 行程表、離線查看、輕鬆分享',
  },
]

export default function HomePage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-border z-30 safe-top">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-light text-foreground">TripPlanner</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="touch-target px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                我的行程
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:block px-4 py-2 text-foreground-secondary hover:text-foreground transition-colors"
                >
                  登入
                </Link>
                <Link
                  to="/login"
                  className="touch-target px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  開始使用
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm mb-6 sm:mb-8">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>免費開始使用</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-foreground leading-tight mb-4 sm:mb-6">
            探索你的<br className="md:hidden" />
            <span className="text-primary">下一趟旅程</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-foreground-secondary mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            與朋友一起規劃、即時協作、輕鬆出發。<br className="hidden sm:block" />
            最簡潔優雅的旅遊行程規劃工具。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="touch-target w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-xl text-base sm:text-lg font-medium hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {user ? '進入我的行程' : '免費開始使用'}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link
              to="/explore"
              className="touch-target w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-border text-foreground-secondary rounded-xl text-base sm:text-lg font-medium hover:bg-background-secondary transition-colors"
            >
              探索行程範例
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 px-4 bg-background-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-3 sm:mb-4">
              功能特色
            </h2>
            <p className="text-sm sm:text-base text-foreground-secondary">
              一切所需，盡在其中
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-border hover:shadow-japanese-lg hover:border-border-dark transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 text-primary rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-4 sm:mb-6">
            準備好開始了嗎？
          </h2>
          <p className="text-base sm:text-lg text-foreground-secondary mb-6 sm:mb-8 px-4">
            立即免費註冊，開始規劃你的下一趟旅程
          </p>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="touch-target inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-xl text-base sm:text-lg font-medium hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {user ? '前往我的行程' : '免費註冊'}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-md flex items-center justify-center">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-xs sm:text-sm text-foreground-secondary">
              © 2024 TripPlanner
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-foreground-muted">
            <Link to="/privacy" className="hover:text-foreground-secondary transition-colors">
              隱私權政策
            </Link>
            <Link to="/terms" className="hover:text-foreground-secondary transition-colors">
              服務條款
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}