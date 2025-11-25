import type { CalendarDay as CalendarDayType } from '@/types/calendar'
import { CalendarDay } from './CalendarDay'

interface CalendarGridProps {
  days: CalendarDayType[]
  onDayClick: (date: Date) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function CalendarGrid({ days, onDayClick }: CalendarGridProps) {
  return (
    <div className="w-full">
      {/* 星期標題 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-light text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期網格 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <CalendarDay
            key={`${day.date.getTime()}-${index}`}
            day={day}
            onClick={onDayClick}
          />
        ))}
      </div>
    </div>
  )
}