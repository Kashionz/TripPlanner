import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTrip } from '@/hooks/useTrip'
import TripForm from '@/components/trip/TripForm'

export default function TripEditPage() {
  const { id } = useParams()
  const isNew = !id
  const { trip, loading, error } = useTrip(id)

  if (!isNew && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">載入中...</p>
        </div>
      </div>
    )
  }

  if (!isNew && error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            to="/dashboard"
            className="text-primary hover:underline"
          >
            返回儀表板
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-japanese-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={id ? `/trip/${id}` : '/dashboard'}
          className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
        </Link>
        <h1 className="text-2xl font-light text-foreground">
          {isNew ? '新增行程' : '編輯行程'}
        </h1>
      </div>

      {/* Form */}
      <TripForm trip={trip} />
    </div>
  )
}