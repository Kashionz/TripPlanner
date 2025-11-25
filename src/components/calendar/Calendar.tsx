import { useCalendar } from '@/hooks/useCalendar'
import { CalendarEventList } from './CalendarEventList'
import { CalendarGrid } from './CalendarGrid'
import { CalendarHeader } from './CalendarHeader'

export function Calendar() {
  const {
    currentMonth,
    calendarDays,
    selectedDate,
    selectedDateEvents,
    setSelectedDate,
    goToToday,
    goToPrevMonth,
    goToNextMonth,
    eventsLoading,
  } = useCalendar()

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <CalendarHeader
        currentMonth={currentMonth}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
      />

      <CalendarGrid
        days={calendarDays}
        onDayClick={setSelectedDate}
      />

      <CalendarEventList
        events={selectedDateEvents}
        selectedDate={selectedDate}
      />
    </div>
  )
}