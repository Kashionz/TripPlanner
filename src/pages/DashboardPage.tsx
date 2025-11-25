import { useAuthStore } from '@/stores/authStore'
import { useTrips } from '@/hooks/useTrip'
import TripList from '@/components/trip/TripList'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { trips, loading, error } = useTrips()

  // 分類行程
  const planningTrips = trips.filter((trip) => trip.status === 'planning')
  const ongoingTrips = trips.filter((trip) => trip.status === 'ongoing')
  const completedTrips = trips.filter((trip) => trip.status === 'completed')

  // 統計
  const totalTrips = trips.length

  return (
    <div className="space-y-8 animate-japanese-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-foreground mb-1">
          我的行程
        </h1>
        <p className="text-foreground-secondary">
          歡迎回來，{user?.displayName || '旅人'}
        </p>
      </div>

      {/* Trip Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-border">
          <div className="text-3xl font-light text-foreground mb-1">
            {totalTrips}
          </div>
          <div className="text-sm text-foreground-muted">全部行程</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border">
          <div className="text-3xl font-light text-foreground mb-1">
            {planningTrips.length}
          </div>
          <div className="text-sm text-foreground-muted">規劃中</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border">
          <div className="text-3xl font-light text-foreground mb-1">
            {completedTrips.length}
          </div>
          <div className="text-sm text-foreground-muted">已完成</div>
        </div>
      </div>

      {/* Trip Sections */}
      {/* 進行中的行程 */}
      {ongoingTrips.length > 0 && (
        <section>
          <h2 className="text-xl font-light text-foreground mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-full"></span>
            進行中
          </h2>
          <TripList trips={ongoingTrips} />
        </section>
      )}

      {/* 規劃中的行程 */}
      <section>
        <h2 className="text-xl font-light text-foreground mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          規劃中
        </h2>
        <TripList trips={planningTrips} loading={loading} error={error} />
      </section>

      {/* 已完成的行程 */}
      {completedTrips.length > 0 && (
        <section>
          <h2 className="text-xl font-light text-foreground mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
            已完成
          </h2>
          <TripList trips={completedTrips} />
        </section>
      )}
    </div>
  )
}