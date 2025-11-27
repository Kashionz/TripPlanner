import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  LogIn,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAcceptInvite } from '@/hooks/useCollaboration'
import type { MemberRole } from '@/types/trip'

const roleLabels: Record<MemberRole, string> = {
  owner: '擁有者',
  editor: '編輯者',
  viewer: '檢視者',
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading, signInWithGoogle } = useAuthStore()
  
  const {
    invite,
    loading: inviteLoading,
    error: inviteError,
    fetchInvite,
    accept,
  } = useAcceptInvite()

  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 載入邀請資訊
  useEffect(() => {
    if (token) {
      fetchInvite(token)
    }
  }, [token, fetchInvite])

  // 處理接受邀請
  const handleAccept = async () => {
    if (!invite) return

    setAccepting(true)
    setAcceptError(null)

    const result = await accept(invite.id)

    if (result.success && 'tripId' in result && result.tripId) {
      setSuccess(true)
      // 延遲導航，讓用戶看到成功訊息
      setTimeout(() => {
        navigate(`/trip/${result.tripId}`)
      }, 1500)
    } else {
      setAcceptError(result.message)
    }

    setAccepting(false)
  }

  // 處理登入
  const handleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      // 錯誤已在 store 中處理
    }
  }

  // 載入中
  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">載入中...</p>
        </div>
      </div>
    )
  }

  // 邀請無效
  if (inviteError || !invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-xl font-medium text-foreground mb-2">
            邀請無效
          </h1>
          
          <p className="text-foreground-secondary mb-6">
            {inviteError || '此邀請連結不存在或已失效'}
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            返回首頁
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // 邀請已過期
  if (invite.status === 'expired' || invite.expiresAt.toDate() < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
          
          <h1 className="text-xl font-medium text-foreground mb-2">
            邀請已過期
          </h1>
          
          <p className="text-foreground-secondary mb-6">
            此邀請連結已過期，請聯繫行程擁有者重新發送邀請。
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            返回首頁
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // 邀請已被使用
  if (invite.status === 'accepted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
          
          <h1 className="text-xl font-medium text-foreground mb-2">
            邀請已被使用
          </h1>
          
          <p className="text-foreground-secondary mb-6">
            此邀請連結已被接受使用。如果是您接受的，請前往行程頁面。
          </p>

          <div className="flex flex-col gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                前往我的行程
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                登入
                <LogIn className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 成功加入
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border p-8 text-center animate-japanese-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className="text-xl font-medium text-foreground mb-2">
            成功加入行程！
          </h1>
          
          <p className="text-foreground-secondary mb-4">
            正在前往「{invite.tripTitle}」...
          </p>

          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }

  // 未登入 - 顯示登入提示
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-xl font-medium text-foreground mb-2">
            您收到一份邀請
          </h1>
          
          <p className="text-foreground-secondary mb-6">
            <span className="font-medium">{invite.inviterName}</span> 邀請您加入行程
          </p>

          {/* 行程資訊 */}
          <div className="bg-background-secondary rounded-xl p-4 mb-6">
            <h2 className="text-lg font-medium text-foreground mb-1">
              {invite.tripTitle}
            </h2>
            <p className="text-sm text-foreground-muted">
              角色：{roleLabels[invite.role]}
            </p>
          </div>

          <p className="text-foreground-muted mb-6">
            請先登入以接受邀請
          </p>

          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            使用 Google 登入
          </button>
        </div>
      </div>
    )
  }

  // 已登入 - 顯示接受邀請
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-border p-8 text-center animate-japanese-fade-in">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-xl font-medium text-foreground mb-2">
          您收到一份邀請
        </h1>
        
        <p className="text-foreground-secondary mb-6">
          <span className="font-medium">{invite.inviterName}</span> 邀請您加入
        </p>

        {/* 行程資訊 */}
        <div className="bg-background-secondary rounded-xl p-4 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-1">
            {invite.tripTitle}
          </h2>
          <p className="text-sm text-foreground-muted">
            角色：{roleLabels[invite.role]}
          </p>
        </div>

        {/* 錯誤訊息 */}
        {acceptError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 text-left">{acceptError}</p>
          </div>
        )}

        {/* 按鈕 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                加入中...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                接受邀請
              </>
            )}
          </button>

          <Link
            to="/dashboard"
            className="w-full px-6 py-3 border border-border text-foreground-secondary rounded-xl font-medium hover:bg-background-secondary transition-colors"
          >
            返回我的行程
          </Link>
        </div>

        {/* 登入資訊 */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-foreground-muted">
            登入為：{user.displayName}
          </p>
        </div>
      </div>
    </div>
  )
}