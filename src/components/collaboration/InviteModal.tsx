import { useAcceptInvite, useTripInvites } from '@/hooks/useCollaboration'
import type { Invite } from '@/types/collaboration'
import type { MemberRole } from '@/types/trip'
import {
    AlertCircle,
    Check,
    Clock,
    Copy,
    Link,
    Loader2,
    Mail,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface InviteModalProps {
  tripId: string
  tripTitle: string
  isOpen: boolean
  onClose: () => void
}

type InviteTab = 'link' | 'email' | 'pending'

const roleLabels: Record<MemberRole, string> = {
  owner: '擁有者',
  editor: '編輯者',
  viewer: '檢視者',
}

const roleDescriptions: Record<MemberRole, string> = {
  owner: '完整權限，包含刪除行程',
  editor: '可編輯行程、景點、費用',
  viewer: '僅能查看行程內容',
}

export default function InviteModal({
  tripId,
  tripTitle,
  isOpen,
  onClose,
}: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<InviteTab>('link')
  const [selectedRole, setSelectedRole] = useState<MemberRole>('editor')
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { pendingInvites, create, revoke, remove, getLink, copyLink } =
    useTripInvites(tripId)

  const handleCreateInvite = async () => {
    setCreating(true)
    setError(null)
    try {
      const invite = await create(
        selectedRole,
        activeTab === 'email' ? email : undefined,
        tripTitle
      )
      setCreatedInvite(invite)
      if (activeTab === 'email') {
        setEmail('')
      }
    } catch (err: any) {
      setError(err.message || '建立邀請失敗')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!createdInvite) return
    const success = await copyLink(createdInvite.token)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revoke(inviteId)
    } catch (err: any) {
      setError(err.message || '撤銷邀請失敗')
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      await remove(inviteId)
    } catch (err: any) {
      setError(err.message || '刪除邀請失敗')
    }
  }

  const handleClose = () => {
    setCreatedInvite(null)
    setCopied(false)
    setError(null)
    setEmail('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-japanese-fade-in safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            邀請成員
          </h2>
          <button
            onClick={handleClose}
            className="touch-target p-2 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Tabs - 手機版縮小間距 */}
        <div className="flex border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('link')}
            className={`touch-target flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'link'
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground-muted hover:text-foreground-secondary'
            }`}
          >
            <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
            邀請連結
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`touch-target flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'email'
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground-muted hover:text-foreground-secondary'
            }`}
          >
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
            Email 邀請
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`touch-target flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'pending'
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground-muted hover:text-foreground-secondary'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
            待處理
            {pendingInvites.length > 0 && (
              <span className="absolute top-1 sm:top-2 right-2 sm:right-4 w-4 h-4 sm:w-5 sm:h-5 bg-accent text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                {pendingInvites.length}
              </span>
            )}
          </button>
        </div>

        {/* Content - 手機版減少 padding */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 邀請連結 / Email 邀請 */}
          {(activeTab === 'link' || activeTab === 'email') && (
            <div className="space-y-6">
              {/* 已建立的邀請 */}
              {createdInvite && (
                <div className="p-4 bg-background-secondary rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">邀請已建立！</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={getLink(createdInvite.token)}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          已複製
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          複製
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    此連結將於 72 小時後過期
                  </p>
                  <button
                    onClick={() => setCreatedInvite(null)}
                    className="text-sm text-primary hover:underline"
                  >
                    建立新邀請
                  </button>
                </div>
              )}

              {/* 建立新邀請 */}
              {!createdInvite && (
                <>
                  {/* Email 輸入（僅 Email 邀請） */}
                  {activeTab === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email 地址
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="輸入要邀請的 Email"
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <p className="mt-2 text-xs text-foreground-muted">
                        僅此 Email 的使用者可以使用此邀請
                      </p>
                    </div>
                  )}

                  {/* 角色選擇 */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      選擇角色
                    </label>
                    <div className="space-y-2">
                      {(['editor', 'viewer'] as MemberRole[]).map((role) => (
                        <label
                          key={role}
                          className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedRole === role
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role}
                            checked={selectedRole === role}
                            onChange={() => setSelectedRole(role)}
                            className="mt-1 accent-primary"
                          />
                          <div>
                            <div className="font-medium text-foreground">
                              {roleLabels[role]}
                            </div>
                            <div className="text-sm text-foreground-muted">
                              {roleDescriptions[role]}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 建立按鈕 */}
                  <button
                    onClick={handleCreateInvite}
                    disabled={creating || (activeTab === 'email' && !email)}
                    className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        建立中...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        建立邀請
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* 待處理邀請列表 */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingInvites.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
                  <p className="text-foreground-muted">目前沒有待處理的邀請</p>
                </div>
              ) : (
                pendingInvites.map((invite) => (
                  <InviteItem
                    key={invite.id}
                    invite={invite}
                    onRevoke={() => handleRevokeInvite(invite.id)}
                    onDelete={() => handleDeleteInvite(invite.id)}
                    onCopy={async () => {
                      const success = await copyLink(invite.token)
                      return success
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 邀請項目元件
interface InviteItemProps {
  invite: Invite
  onRevoke: () => void
  onDelete: () => void
  onCopy: () => Promise<boolean>
}

function InviteItem({ invite, onRevoke, onDelete, onCopy }: InviteItemProps) {
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCopy = async () => {
    const success = await onCopy()
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRevoke = async () => {
    setRevoking(true)
    await onRevoke()
    setRevoking(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  const expiresAt = invite.expiresAt.toDate()
  const isExpired = expiresAt < new Date()
  const hoursLeft = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
  )

  return (
    <div className="p-4 border border-border rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {roleLabels[invite.role]}
            </span>
            {invite.email && (
              <span className="text-xs bg-background-secondary px-2 py-0.5 rounded text-foreground-muted">
                {invite.email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Clock className="w-3 h-3" />
            {isExpired ? (
              <span className="text-red-500">已過期</span>
            ) : (
              <span>{hoursLeft} 小時後過期</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-colors ${
              copied
                ? 'bg-green-100 text-green-600'
                : 'hover:bg-background-secondary text-foreground-secondary'
            }`}
            title="複製連結"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="p-2 rounded-lg hover:bg-background-secondary text-foreground-secondary transition-colors"
            title="撤銷邀請"
          >
            {revoking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            title="刪除邀請"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 接受邀請頁面元件
export function AcceptInviteView({
  token,
  onSuccess,
  onError,
}: {
  token: string
  onSuccess: (tripId: string) => void
  onError: (message: string) => void
}) {
  const { invite, loading, error, fetchInvite, accept } =
    useAcceptInvite()
  const [accepting, setAccepting] = useState(false)

  // 載入邀請資訊
  useEffect(() => {
    fetchInvite(token)
  }, [token, fetchInvite])

  const handleAccept = async () => {
    if (!invite) return
    setAccepting(true)
    const result = await accept(invite.id)
    setAccepting(false)
    
    if (result.success && 'tripId' in result && result.tripId) {
      onSuccess(result.tripId)
    } else {
      onError(result.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-foreground-muted">載入邀請資訊...</p>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-foreground mb-2">邀請無效或已過期</p>
        <p className="text-sm text-foreground-muted">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-2xl border border-border p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-xl font-medium text-foreground mb-2">
          您收到一份邀請
        </h2>
        
        <p className="text-foreground-secondary mb-6">
          <span className="font-medium">{invite.inviterName}</span> 邀請您加入
        </p>
        
        <div className="bg-background-secondary rounded-xl p-4 mb-6">
          <h3 className="text-lg font-medium text-foreground mb-1">
            {invite.tripTitle}
          </h3>
          <p className="text-sm text-foreground-muted">
            角色：{roleLabels[invite.role]}
          </p>
        </div>

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {accepting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              加入中...
            </>
          ) : (
            '接受邀請'
          )}
        </button>
      </div>
    </div>
  )
}