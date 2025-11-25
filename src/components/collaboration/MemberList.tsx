import { useState } from 'react'
import {
  Users,
  Crown,
  Edit3,
  Eye,
  MoreVertical,
  Shield,
  UserMinus,
  LogOut,
  Loader2,
} from 'lucide-react'
import { useMemberActions } from '@/hooks/useCollaboration'
import { useAuthStore } from '@/stores/authStore'
import type { TripMember, MemberRole } from '@/types/trip'

interface MemberListProps {
  tripId: string
  members: TripMember[]
  currentUserRole?: MemberRole
  onInvite?: () => void
}

const roleIcons: Record<MemberRole, typeof Crown> = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
}

const roleLabels: Record<MemberRole, string> = {
  owner: '擁有者',
  editor: '編輯者',
  viewer: '檢視者',
}

const roleColors: Record<MemberRole, string> = {
  owner: 'text-amber-600 bg-amber-50',
  editor: 'text-primary bg-primary/10',
  viewer: 'text-foreground-muted bg-background-secondary',
}

export default function MemberList({
  tripId,
  members,
  currentUserRole,
  onInvite,
}: MemberListProps) {
  const { user } = useAuthStore()
  const isOwner = currentUserRole === 'owner'
  const canManage = isOwner || currentUserRole === 'editor'

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Users className="w-5 h-5" />
          成員 ({members.length})
        </h3>
        {canManage && onInvite && (
          <button
            onClick={onInvite}
            className="text-sm text-primary hover:underline"
          >
            邀請成員
          </button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <MemberItem
            key={member.id}
            tripId={tripId}
            member={member}
            isCurrentUser={member.userId === user?.id}
            canManage={isOwner && member.role !== 'owner'}
            showActions={isOwner}
          />
        ))}
      </div>
    </div>
  )
}

// 成員項目元件
interface MemberItemProps {
  tripId: string
  member: TripMember
  isCurrentUser: boolean
  canManage: boolean
  showActions: boolean
}

function MemberItem({
  tripId,
  member,
  isCurrentUser,
  canManage,
  showActions,
}: MemberItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  
  const { loading, updateRole, removeMember, leave } = useMemberActions(tripId)

  const RoleIcon = roleIcons[member.role]

  const handleRoleChange = async (newRole: MemberRole) => {
    try {
      await updateRole(member.id, member.userId, newRole)
      setShowRoleMenu(false)
      setShowMenu(false)
    } catch (err) {
      // 錯誤已在 hook 中處理
    }
  }

  const handleRemove = async () => {
    try {
      await removeMember(member.id, member.userId)
      setShowRemoveConfirm(false)
      setShowMenu(false)
    } catch (err) {
      // 錯誤已在 hook 中處理
    }
  }

  const handleLeave = async () => {
    try {
      await leave()
      setShowLeaveConfirm(false)
    } catch (err) {
      // 錯誤已在 hook 中處理
    }
  }

  return (
    <>
      <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-background-secondary transition-colors group">
        <div className="flex items-center gap-3">
          {member.user?.photoURL ? (
            <img
              src={member.user.photoURL}
              alt={member.user.displayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
              {member.user?.displayName?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {member.user?.displayName || '使用者'}
              </span>
              {isCurrentUser && (
                <span className="text-xs text-primary">(你)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${roleColors[member.role]}`}
              >
                <RoleIcon className="w-3 h-3" />
                {roleLabels[member.role]}
              </span>
            </div>
          </div>
        </div>

        {/* 操作選單 */}
        {(showActions || isCurrentUser) && member.role !== 'owner' && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-background-tertiary transition-all"
            >
              <MoreVertical className="w-4 h-4 text-foreground-secondary" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => {
                    setShowMenu(false)
                    setShowRoleMenu(false)
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-border py-1 z-20">
                  {/* 變更角色 */}
                  {canManage && (
                    <div className="relative">
                      <button
                        onClick={() => setShowRoleMenu(!showRoleMenu)}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-background-secondary flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        變更角色
                      </button>

                      {showRoleMenu && (
                        <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-xl shadow-lg border border-border py-1">
                          {(['editor', 'viewer'] as MemberRole[]).map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(role)}
                              disabled={loading || member.role === role}
                              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                                member.role === role
                                  ? 'bg-background-secondary text-foreground-muted'
                                  : 'text-foreground hover:bg-background-secondary'
                              }`}
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                roleIcons[role] && (
                                  <span className="w-4 h-4">
                                    {(() => {
                                      const Icon = roleIcons[role]
                                      return <Icon className="w-4 h-4" />
                                    })()}
                                  </span>
                                )
                              )}
                              {roleLabels[role]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 移除成員 */}
                  {canManage && (
                    <button
                      onClick={() => setShowRemoveConfirm(true)}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      移除成員
                    </button>
                  )}

                  {/* 離開行程 */}
                  {isCurrentUser && (
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      離開行程
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 移除確認 Modal */}
      {showRemoveConfirm && (
        <ConfirmModal
          title="移除成員"
          message={`確定要將 ${member.user?.displayName || '此成員'} 移出行程嗎？`}
          confirmText="移除"
          loading={loading}
          onConfirm={handleRemove}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}

      {/* 離開確認 Modal */}
      {showLeaveConfirm && (
        <ConfirmModal
          title="離開行程"
          message="確定要離開此行程嗎？離開後將無法查看行程內容。"
          confirmText="離開"
          loading={loading}
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
    </>
  )
}

// 確認 Modal
interface ConfirmModalProps {
  title: string
  message: string
  confirmText: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  title,
  message,
  confirmText,
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-japanese-fade-in">
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-foreground-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground-secondary hover:bg-background-secondary transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                處理中...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 簡化版成員列表（用於側邊欄等）
interface MemberListCompactProps {
  members: TripMember[]
  maxShow?: number
  onShowAll?: () => void
}

export function MemberListCompact({
  members,
  maxShow = 5,
  onShowAll,
}: MemberListCompactProps) {
  const displayMembers = members.slice(0, maxShow)
  const remainingCount = Math.max(0, members.length - maxShow)

  return (
    <div className="space-y-3">
      {displayMembers.map((member) => (
        <div key={member.id} className="flex items-center gap-3">
          {member.user?.photoURL ? (
            <img
              src={member.user.photoURL}
              alt={member.user.displayName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
              {member.user?.displayName?.charAt(0) || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {member.user?.displayName || '使用者'}
            </div>
            <div className="text-xs text-foreground-muted">
              {roleLabels[member.role]}
            </div>
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <button
          onClick={onShowAll}
          className="text-sm text-primary hover:underline"
        >
          還有 {remainingCount} 位成員...
        </button>
      )}
    </div>
  )
}

// 成員頭像列表（用於緊湊顯示）
interface MemberAvatarsProps {
  members: TripMember[]
  maxShow?: number
  size?: 'sm' | 'md' | 'lg'
}

export function MemberAvatars({
  members,
  maxShow = 4,
  size = 'md',
}: MemberAvatarsProps) {
  const displayMembers = members.slice(0, maxShow)
  const remainingCount = Math.max(0, members.length - maxShow)

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  }

  return (
    <div className="flex items-center">
      {displayMembers.map((member, index) => (
        <div
          key={member.id}
          className={`relative ${index > 0 ? overlapClasses[size] : ''}`}
          style={{ zIndex: members.length - index }}
        >
          {member.user?.photoURL ? (
            <img
              src={member.user.photoURL}
              alt={member.user.displayName}
              className={`${sizeClasses[size]} rounded-full border-2 border-white`}
              title={member.user.displayName}
            />
          ) : (
            <div
              className={`${sizeClasses[size]} bg-primary rounded-full flex items-center justify-center text-white border-2 border-white`}
              title={member.user?.displayName || '使用者'}
            >
              {member.user?.displayName?.charAt(0) || '?'}
            </div>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} ${overlapClasses[size]} bg-background-secondary rounded-full flex items-center justify-center text-foreground-muted border-2 border-white`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}