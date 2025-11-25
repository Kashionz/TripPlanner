import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Image, Loader2 } from 'lucide-react'
import type { Trip } from '@/types/trip'
import { useTripActions, useDateFormatter } from '@/hooks/useTrip'

interface TripFormProps {
  trip?: Trip | null
  onSuccess?: (tripId: string) => void
}

interface FormData {
  title: string
  description: string
  startDate: string
  endDate: string
  coverImage: string | null
}

export default function TripForm({ trip, onSuccess }: TripFormProps) {
  const navigate = useNavigate()
  const { createTrip, updateTrip } = useTripActions()
  const { getDaysDiff } = useDateFormatter()
  const isEditing = !!trip

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    coverImage: null,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化表單資料
  useEffect(() => {
    if (trip) {
      setFormData({
        title: trip.title,
        description: trip.description,
        startDate: formatDateForInput(trip.startDate.toDate()),
        endDate: formatDateForInput(trip.endDate.toDate()),
        coverImage: trip.coverImage,
      })
    }
  }, [trip])

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('請輸入行程名稱')
      return false
    }
    if (!formData.startDate) {
      setError('請選擇開始日期')
      return false
    }
    if (!formData.endDate) {
      setError('請選擇結束日期')
      return false
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('結束日期必須在開始日期之後')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      if (isEditing && trip) {
        await updateTrip(trip.id, {
          title: formData.title,
          description: formData.description,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          coverImage: formData.coverImage,
        })
        if (onSuccess) {
          onSuccess(trip.id)
        } else {
          navigate(`/trip/${trip.id}`)
        }
      } else {
        const tripId = await createTrip({
          title: formData.title,
          description: formData.description,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          coverImage: formData.coverImage,
        })
        if (onSuccess) {
          onSuccess(tripId)
        } else {
          navigate(`/trip/${tripId}`)
        }
      }
    } catch (err: any) {
      console.error('儲存行程失敗:', err)
      setError(err.message || '儲存失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  // 計算天數
  const tripDays = formData.startDate && formData.endDate
    ? getDaysDiff(new Date(formData.startDate), new Date(formData.endDate))
    : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 錯誤提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 基本資訊 */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">
          基本資訊
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              行程名稱 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例：東京五日遊"
              className="input-japanese"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              行程描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="簡短描述這趟旅程..."
              className="input-japanese resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                開始日期 *
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input-japanese pl-12"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                結束日期 *
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className="input-japanese pl-12"
                  required
                />
              </div>
            </div>
          </div>

          {tripDays > 0 && (
            <div className="text-sm text-foreground-muted">
              共 <span className="font-medium text-primary">{tripDays}</span> 天
            </div>
          )}
        </div>
      </div>

      {/* 封面圖片 */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-medium text-foreground mb-4">
          封面圖片
        </h3>
        <div className="aspect-video bg-background-secondary rounded-xl flex items-center justify-center border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
          {formData.coverImage ? (
            <img
              src={formData.coverImage}
              alt="封面預覽"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="text-center">
              <Image className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
              <span className="text-sm text-foreground-muted">上傳圖片</span>
            </div>
          )}
        </div>
        <p className="text-xs text-foreground-muted mt-2">
          圖片上傳功能即將推出
        </p>
      </div>

      {/* 送出按鈕 */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex-1 px-6 py-3 border border-border text-foreground-secondary rounded-xl font-medium hover:bg-background-secondary transition-colors"
          disabled={loading}
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              儲存中...
            </>
          ) : (
            isEditing ? '更新行程' : '建立行程'
          )}
        </button>
      </div>
    </form>
  )
}