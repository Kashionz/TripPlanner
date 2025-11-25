import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarHeaderProps {
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-light text-foreground">
        {year}年{month}月
      </h2>

      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-light text-foreground hover:bg-background-secondary rounded-lg transition-colors"
        >
          今天
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
            aria-label="上個月"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
            aria-label="下個月"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}