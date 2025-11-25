import { Link } from 'react-router-dom'
import { Plus, MapPin } from 'lucide-react'
import type { Trip } from '@/types/trip'
import TripCard from './TripCard'

interface TripListProps {
  trips: Trip[]
  loading?: boolean
  error?: string | null
}

export default function TripList({ trips, loading, error }: TripListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border overflow-hidden animate-pulse"
          >
            <div className="aspect-video bg-background-secondary" />
            <div className="p-5 space-y-3">
              <div className="h-6 bg-background-secondary rounded w-3/4" />
              <div className="h-4 bg-background-secondary rounded w-1/2" />
              <div className="h-4 bg-background-secondary rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl p-8 border border-red-200 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          重新載入
        </button>
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-border text-center">
        <div className="w-16 h-16 bg-background-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-foreground-muted" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          尚無行程
        </h3>
        <p className="text-foreground-secondary mb-6">
          建立你的第一個旅遊行程吧！
        </p>
        <Link
          to="/trip/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          新增行程
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          placeCount={0}
          memberCount={1}
        />
      ))}

      {/* Add New Trip Card */}
      <Link
        to="/trip/new"
        className="flex flex-col items-center justify-center min-h-[280px] bg-background-secondary rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-300"
      >
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <span className="text-foreground-secondary">新增行程</span>
      </Link>
    </div>
  )
}