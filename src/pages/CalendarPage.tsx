import { Calendar } from '@/components/calendar'
import { useAuthStore } from '@/stores/authStore'
import { useTripStore } from '@/stores/tripStore'
import { useEffect } from 'react'

export default function CalendarPage() {
  const { user } = useAuthStore()
  const { subscribeToUserTrips, cleanup } = useTripStore()

  useEffect(() => {
    if (user) {
      subscribeToUserTrips(user.id)
    }

    return () => {
      cleanup()
    }
  }, [user, subscribeToUserTrips, cleanup])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">
            行程日曆
          </h1>
          <p className="text-muted-foreground">
            查看所有行程的時間安排
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
          <Calendar />
        </div>
      </div>
    </div>
  )
}