import { useState, useEffect } from 'react'
import { X, Clock, MapPin, FileText } from 'lucide-react'
import type { Place, PlaceCategory } from '@/types/place'
import { getCategoryLabel, getCategoryColor, formatDuration } from '@/services/placeService'

interface PlaceEditModalProps {
  place: Place
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    startTime: string | null
    endTime: string | null
    duration: number
    note: string
    category: PlaceCategory
  }) => Promise<void>
}

export default function PlaceEditModal({
  place,
  isOpen,
  onClose,
  onSave,
}: PlaceEditModalProps) {
  const [startTime, setStartTime] = useState(place.startTime || '')
  const [duration, setDuration] = useState(place.duration || 60)
  const [note, setNote] = useState(place.note || '')
  const [category, setCategory] = useState<PlaceCategory>(place.category)
  const [isSaving, setIsSaving] = useState(false)

  // 重置表單
  useEffect(() => {
    if (isOpen) {
      setStartTime(place.startTime || '')
      setDuration(place.duration || 60)
      setNote(place.note || '')
      setCategory(place.category)
    }
  }, [isOpen, place])

  // 計算結束時間
  const calculateEndTime = (): string | null => {
    if (!startTime) return null

    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration

    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSave({
        startTime: startTime || null,
        endTime: calculateEndTime(),
        duration,
        note,
        category,
      })
      onClose()
    } catch (error) {
      console.error('儲存失敗:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const categories: PlaceCategory[] = ['attraction', 'restaurant', 'hotel', 'transport', 'other']
  const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-japanese-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">編輯景點</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* 景點資訊 */}
          <div className="bg-background-secondary/50 rounded-xl p-4">
            <h4 className="font-medium text-foreground mb-1">{place.name}</h4>
            <p className="text-sm text-foreground-muted flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {place.address}
            </p>
          </div>

          {/* 類別 */}
          <div>
            <label className="block text-sm text-foreground-secondary mb-2">
              類別
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? 'text-white'
                      : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
                  }`}
                  style={
                    category === cat
                      ? { backgroundColor: getCategoryColor(cat) }
                      : undefined
                  }
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* 時間設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-foreground-secondary mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                開始時間
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-japanese"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground-secondary mb-2">
                停留時間
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-japanese"
              >
                {durationOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDuration(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 預計結束時間顯示 */}
          {startTime && (
            <div className="text-sm text-foreground-muted">
              預計結束時間：{calculateEndTime()}
            </div>
          )}

          {/* 備註 */}
          <div>
            <label className="block text-sm text-foreground-secondary mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              備註
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="新增備註..."
              rows={3}
              className="input-japanese resize-none"
            />
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-foreground-secondary hover:bg-background-secondary transition-colors"
              disabled={isSaving}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 刪除確認 Modal
interface DeleteConfirmModalProps {
  placeName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteConfirmModal({
  placeName,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('刪除失敗:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-japanese-fade-in">
        <h3 className="text-lg font-medium text-foreground mb-2">
          確定要刪除此景點？
        </h3>
        <p className="text-foreground-secondary mb-6">
          「{placeName}」將從行程中移除，此操作無法復原。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-xl text-foreground-secondary hover:bg-background-secondary transition-colors"
            disabled={isDeleting}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? '刪除中...' : '確定刪除'}
          </button>
        </div>
      </div>
    </div>
  )
}