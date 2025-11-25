import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'
import { Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CalendarEventItemProps {
  event: CalendarEvent
}

const STATUS_TEXT = {
  planning: '規劃中',
  ongoing: '進行中',
  completed: '已完成',
}

export function CalendarEventItem({ event }: CalendarEventItemProps) {
  const navigate = useNavigate()

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const handleClick = () => {
    navigate(`/trip/${event.tripId}`)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 rounded-xl border border-border bg-white hover:bg-background-secondary transition-all hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-full rounded-full flex-shrink-0"
          style={{ backgroundColor: event.color }}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1 truncate">
            {event.title}
          </h3>
          
          {event.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {event.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDate(event.startDate)} - {formatDate(event.endDate)}
              </span>
            </div>
            
            <div
              className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                event.status === 'planning' && 'bg-blue-100 text-blue-700',
                event.status === 'ongoing' && 'bg-green-100 text-green-700',
                event.status === 'completed' && 'bg-gray-100 text-gray-700'
              )}
            >
              {STATUS_TEXT[event.status]}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}