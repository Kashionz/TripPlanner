import type { CalendarEvent } from '@/types/calendar'
import { CalendarEventItem } from './CalendarEventItem'

interface CalendarEventListProps {
  events: CalendarEvent[]
  selectedDate: Date | null
}

export function CalendarEventList({ events, selectedDate }: CalendarEventListProps) {
  const getTitle = () => {
    if (!selectedDate) {
      return '今日行程'
    }
    
    const today = new Date()
    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    
    if (isToday) {
      return '今日行程'
    }
    
    return `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日的行程`
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-light text-foreground mb-4">
        {getTitle()}
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-sm">
            此日期沒有行程
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <CalendarEventItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}