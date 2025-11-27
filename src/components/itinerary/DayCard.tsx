import { useDateFormatter } from '@/hooks/useTrip'
import type { Day } from '@/types/trip'
import { Calendar, Check, ChevronDown, ChevronUp, Edit2, Plus, X } from 'lucide-react'
import { useState } from 'react'

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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-border overflow-hidden">
      {/* Header - 手機版精簡 */}
      <div
        className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-background-secondary/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-medium text-foreground">
              Day {day.dayNumber}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted truncate">
              {formatDate(date)} <span className="hidden sm:inline">({dayOfWeek})</span>
            </p>
          </div>
        </div>

        <button
          className="touch-target p-2 hover:bg-background-secondary rounded-lg transition-colors flex-shrink-0"
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
          {/* Note - 手機版減少 padding */}
          <div className="p-3 sm:p-4 border-b border-border bg-background-secondary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      placeholder="今日備註..."
                      className="input-japanese resize-none text-xs sm:text-sm"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNote}
                        disabled={isSaving}
                        className="touch-target flex items-center gap-1 px-3 py-1.5 sm:py-1 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        儲存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="touch-target flex items-center gap-1 px-3 py-1.5 sm:py-1 border border-border text-foreground-secondary rounded-lg text-xs sm:text-sm hover:bg-background-secondary transition-colors"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="text-xs sm:text-sm text-foreground-secondary flex-1">
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
                        className="touch-target p-1 hover:bg-background-secondary rounded transition-colors flex-shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground-muted" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Places */}
          <div className="p-3 sm:p-4">
            {children ? (
              <div className="space-y-2 sm:space-y-3">
                {children}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-foreground-muted">
                <p className="text-sm sm:text-base mb-2">尚無景點</p>
                {isEditing && onAddPlace && (
                  <button
                    onClick={() => onAddPlace(day.id)}
                    className="touch-target inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增景點
                  </button>
                )}
              </div>
            )}

            {/* Add Place Button - 手機版更突出 */}
            {isEditing && onAddPlace && children && (
              <button
                onClick={() => onAddPlace(day.id)}
                className="touch-target w-full mt-3 sm:mt-4 py-2.5 sm:py-3 border-2 border-dashed border-border text-foreground-muted rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
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