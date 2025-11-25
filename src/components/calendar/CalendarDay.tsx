import { cn } from '@/lib/utils'
import type { CalendarDay as CalendarDayType } from '@/types/calendar'

interface CalendarDayProps {
  day: CalendarDayType
  onClick: (date: Date) => void
}

export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const { date, isCurrentMonth, isToday, isSelected, events, hasEvents } = day

  return (
    <button
      onClick={() => onClick(date)}
      className={cn(
        'aspect-square p-2 rounded-lg border transition-all',
        'hover:bg-background-secondary hover:border-primary/30',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        isCurrentMonth ? 'border-border' : 'border-transparent',
        isSelected && 'bg-primary/10 border-primary',
        isToday && 'ring-2 ring-primary/30',
        !isCurrentMonth && 'opacity-40'
      )}
    >
      <div className="flex flex-col items-center justify-between h-full">
        <span
          className={cn(
            'text-sm font-light',
            isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
            isToday && 'font-medium text-primary',
            isSelected && 'font-medium'
          )}
        >
          {date.getDate()}
        </span>
        
        {hasEvents && (
          <div className="flex gap-1 flex-wrap justify-center max-w-full">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: event.color }}
                title={event.title}
              />
            ))}
            {events.length > 3 && (
              <div className="text-[10px] text-muted-foreground">
                +{events.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  )
}