import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { Trip, TripStatus } from '@/types/trip'
import { useDateFormatter } from '@/hooks/useTrip'

interface TripCardProps {
  trip: Trip
  placeCount?: number
  memberCount?: number
}

const statusLabels: Record<TripStatus, string> = {
  planning: '規劃中',
  ongoing: '進行中',
  completed: '已完成',
}

const statusColors: Record<TripStatus, string> = {
  planning: 'bg-primary/10 text-primary',
  ongoing: 'bg-accent/10 text-accent',
  completed: 'bg-secondary/10 text-secondary',
}

export default function TripCard({ trip, placeCount = 0, memberCount = 1 }: TripCardProps) {
  const { formatDate } = useDateFormatter()

  // 預設封面圖片
  const coverImage = trip.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop'

  return (
    <Link
      to={`/trip/${trip.id}`}
      className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-japanese-lg hover:border-border-dark transition-all duration-300"
    >
      {/* Cover Image */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={coverImage}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-xs ${statusColors[trip.status]}`}>
            {statusLabels[trip.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {trip.title}
        </h3>

        {trip.description && (
          <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
            {trip.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-foreground-muted mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(trip.startDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{placeCount} 景點</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-foreground-muted" />
            <span className="text-sm text-foreground-muted">
              {memberCount} 人
            </span>
          </div>
          <span className="text-sm text-primary group-hover:underline">
            查看詳情 →
          </span>
        </div>
      </div>
    </Link>
  )
}