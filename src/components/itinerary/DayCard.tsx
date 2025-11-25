import { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, Plus, Edit2, Check, X } from 'lucide-react'
import type { Day } from '@/types/trip'
import { useDateFormatter } from '@/hooks/useTrip'

interface DayCardProps {
  day: Day
  onUpdateNote?: (dayId: string, note: string) => Promise<void>
  onAddPlace?: (dayId: string) => void
  children?: React.ReactNode
  isEditing?: boolean
}

export default function DayCard({
  day,
  onUpdateNote,
  onAddPlace,
  children,
  isEditing = false,
}: DayCardProps) {
  const { formatDate, formatDayOfWeek } = useDateFormatter()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(day.note || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveNote = async () => {
    if (!onUpdateNote) return
    
    setIsSaving(true)
    try {
      await onUpdateNote(day.id, noteValue)
      setIsEditingNote(false)
    } catch (error) {
      console.error('儲存備註失敗:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNoteValue(day.note || '')
    setIsEditingNote(false)
  }

  const date = day.date.toDate()
  const dayOfWeek = formatDayOfWeek(date)

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-background-secondary/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Day {day.dayNumber}
            </h3>
            <p className="text-sm text-foreground-muted">
              {formatDate(date)} ({dayOfWeek})
            </p>
          </div>
        </div>

        <button
          className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-foreground-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-foreground-muted" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Note */}
          <div className="p-4 border-b border-border bg-background-secondary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      placeholder="今日備註..."
                      className="input-japanese resize-none text-sm"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNote}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        儲存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1 border border-border text-foreground-secondary rounded-lg text-sm hover:bg-background-secondary transition-colors"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-foreground-secondary flex-1">
                      {day.note || (
                        <span className="text-foreground-muted italic">
                          {isEditing ? '點擊新增備註...' : '無備註'}
                        </span>
                      )}
                    </p>
                    {isEditing && onUpdateNote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditingNote(true)
                        }}
                        className="p-1 hover:bg-background-secondary rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-foreground-muted" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Places */}
          <div className="p-4">
            {children ? (
              <div className="space-y-3">
                {children}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground-muted">
                <p className="mb-2">尚無景點</p>
                {isEditing && onAddPlace && (
                  <button
                    onClick={() => onAddPlace(day.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增景點
                  </button>
                )}
              </div>
            )}

            {/* Add Place Button */}
            {isEditing && onAddPlace && children && (
              <button
                onClick={() => onAddPlace(day.id)}
                className="w-full mt-4 py-3 border-2 border-dashed border-border text-foreground-muted rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增景點
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}