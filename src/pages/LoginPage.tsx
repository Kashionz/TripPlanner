import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const { signInWithGoogle, loading, error, clearError } = useAuthStore()

  const handleGoogleLogin = async () => {
    await signInWithGoogle()
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-light text-foreground mb-2">
          歡迎回來
        </h1>
        <p className="text-foreground-secondary">
          登入以繼續使用 TripPlanner
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-error/10 text-error rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-error hover:text-error-dark transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-border rounded-xl text-foreground font-medium hover:bg-background-secondary hover:border-border-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-foreground-muted border-t-primary rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{loading ? '登入中...' : '使用 Google 帳號登入'}</span>
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-foreground-muted">
            或
          </span>
        </div>
      </div>

      {/* Info */}
      <p className="text-center text-sm text-foreground-muted">
        點擊登入即表示您同意我們的
        <a href="/terms" className="text-primary hover:underline mx-1">
          服務條款
        </a>
        與
        <a href="/privacy" className="text-primary hover:underline mx-1">
          隱私權政策
        </a>
      </p>
    </div>
  )
}