import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useTripComments } from '@/hooks/useCollaboration'
import { useAuthStore } from '@/stores/authStore'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { CommentWithUser } from '@/types/collaboration'
import type { TripMember } from '@/types/trip'

interface CommentsProps {
  tripId: string
  members?: TripMember[]
}

export default function Comments({ tripId, members = [] }: CommentsProps) {
  const { user } = useAuthStore()
  const {
    comments,
    loading,
    error,
    submitting,
    add,
    update,
    remove,
  } = useTripComments(tripId)

  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<CommentWithUser | null>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // 自動捲動到最新留言
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  // 處理提及功能
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart || 0
    setNewComment(value)
    setCursorPosition(position)

    // 檢查是否正在輸入 @
    const textBeforeCursor = value.slice(0, position)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (atMatch) {
      setShowMentions(true)
      setMentionQuery(atMatch[1].toLowerCase())
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  // 選擇提及的成員
  const handleSelectMention = (member: TripMember) => {
    const textBeforeCursor = newComment.slice(0, cursorPosition)
    const textAfterCursor = newComment.slice(cursorPosition)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    const newText = 
      textBeforeCursor.slice(0, atIndex) + 
      `@${member.user?.displayName || member.userId} ` + 
      textAfterCursor
    
    setNewComment(newText)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  // 篩選可提及的成員
  const filteredMembers = members.filter(
    (member) =>
      member.user?.displayName?.toLowerCase().includes(mentionQuery) ||
      member.user?.email?.toLowerCase().includes(mentionQuery)
  )

  // 提交留言
  const handleSubmit = async () => {
    if (!newComment.trim()) return

    // 提取提及的使用者
    const mentionPattern = /@(\S+)/g
    const mentions: string[] = []
    let match
    
    while ((match = mentionPattern.exec(newComment)) !== null) {
      const mentionName = match[1]
      const member = members.find(
        (m) => m.user?.displayName === mentionName
      )
      if (member) {
        mentions.push(member.userId)
      }
    }

    try {
      await add(newComment.trim(), mentions, replyingTo?.id)
      setNewComment('')
      setReplyingTo(null)
    } catch (err) {
      // 錯誤已在 hook 中處理
    }
  }

  // 開始編輯
  const handleStartEdit = (comment: CommentWithUser) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  // 儲存編輯
  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return
    
    try {
      await update(editingId, editContent.trim())
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      // 錯誤已在 hook 中處理
    }
  }

  // 刪除留言
  const handleDelete = async (commentId: string) => {
    try {
      await remove(commentId)
    } catch (err) {
      // 錯誤已在 hook 中處理
    }
  }

  // 按 Enter 發送，Shift+Enter 換行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          討論 ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="max-h-[400px] overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
            <p className="text-foreground-muted">還沒有留言</p>
            <p className="text-sm text-foreground-muted mt-1">
              成為第一個留言的人吧！
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwn={comment.userId === user?.id}
              isEditing={editingId === comment.id}
              editContent={editContent}
              onEditChange={setEditContent}
              onStartEdit={() => handleStartEdit(comment)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => {
                setEditingId(null)
                setEditContent('')
              }}
              onDelete={() => handleDelete(comment.id)}
              onReply={() => setReplyingTo(comment)}
            />
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-border bg-background-secondary">
        {/* 回覆提示 */}
        {replyingTo && (
          <div className="mb-3 flex items-center justify-between p-2 bg-white rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="w-4 h-4 text-foreground-muted" />
              <span className="text-foreground-muted">回覆</span>
              <span className="font-medium text-foreground">
                {replyingTo.user.displayName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-foreground-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}

        {/* 提及選單 */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="mb-2 bg-white rounded-lg border border-border shadow-lg max-h-40 overflow-y-auto">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelectMention(member)}
                className="w-full px-4 py-2 text-left hover:bg-background-secondary flex items-center gap-3"
              >
                {member.user?.photoURL ? (
                  <img
                    src={member.user.photoURL}
                    alt={member.user.displayName}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                    {member.user?.displayName?.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-sm text-foreground">
                  {member.user?.displayName || '使用者'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 輸入框 */}
        <div className="flex items-end gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              {user?.displayName?.charAt(0) || '?'}
            </div>
          )}
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="輸入留言... (使用 @ 提及成員)"
              rows={1}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-foreground-muted">
          按 Enter 發送，Shift + Enter 換行
        </p>
      </div>
    </div>
  )
}

// 單一留言元件
interface CommentItemProps {
  comment: CommentWithUser
  isOwn: boolean
  isEditing: boolean
  editContent: string
  onEditChange: (content: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onReply: () => void
}

function CommentItem({
  comment,
  isOwn,
  isEditing,
  editContent,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onReply,
}: CommentItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  const timeAgo = formatDistanceToNow(comment.createdAt.toDate(), {
    addSuffix: true,
    locale: zhTW,
  })

  // 處理內容中的提及
  const renderContent = (content: string) => {
    const parts = content.split(/(@\S+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="flex gap-3 group">
      {comment.user.photoURL ? (
        <img
          src={comment.user.photoURL}
          alt={comment.user.displayName}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
          {comment.user.displayName?.charAt(0) || '?'}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm">
            {comment.user.displayName}
          </span>
          <span className="text-xs text-foreground-muted">{timeAgo}</span>
          {comment.updatedAt && (
            <span className="text-xs text-foreground-muted">(已編輯)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => onEditChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={onSaveEdit}
                className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
              >
                儲存
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 border border-border text-foreground-secondary text-sm rounded-lg hover:bg-background-secondary"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-foreground text-sm whitespace-pre-wrap">
            {renderContent(comment.content)}
          </p>
        )}

        {/* 回覆標記 */}
        {comment.replyTo && (
          <div className="mt-2 text-xs text-foreground-muted flex items-center gap-1">
            <Reply className="w-3 h-3" />
            回覆某則留言
          </div>
        )}
      </div>

      {/* 操作選單 */}
      {isOwn && !isEditing && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-background-secondary transition-all"
          >
            <MoreVertical className="w-4 h-4 text-foreground-muted" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-border py-1 z-20">
                <button
                  onClick={() => {
                    onStartEdit()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-background-secondary flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  編輯
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  刪除
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 回覆按鈕 */}
      {!isEditing && (
        <button
          onClick={onReply}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-background-secondary transition-all"
          title="回覆"
        >
          <Reply className="w-4 h-4 text-foreground-muted" />
        </button>
      )}
    </div>
  )
}

// 緊湊版留言計數顯示
interface CommentCountProps {
  count: number
  onClick?: () => void
}

export function CommentCount({ count, onClick }: CommentCountProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
    >
      <MessageSquare className="w-4 h-4" />
      <span>{count}</span>
    </button>
  )
}