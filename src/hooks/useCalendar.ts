import { useTripStore } from '@/stores/tripStore'
import type { CalendarDay, CalendarEvent } from '@/types/calendar'
import type { Trip, TripStatus } from '@/types/trip'
import { useMemo, useState } from 'react'

// 狀態對應的顏色
const STATUS_COLORS: Record<TripStatus, string> = {
  planning: '#3b82f6', // 藍色
  ongoing: '#10b981',  // 綠色
  completed: '#6b7280', // 灰色
}

interface UseCalendarReturn {
  // 當前月份
  currentMonth: Date
  setCurrentMonth: (date: Date) => void
  
  // 月曆資料
  calendarDays: CalendarDay[]
  
  // 事件資料
  events: CalendarEvent[]
  eventsLoading: boolean
  
  // 選中日期
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void
  
  // 當日事件
  selectedDateEvents: CalendarEvent[]
  
  // 操作方法
  goToToday: () => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  hasEvents: (date: Date) => boolean
  getEventsForDate: (date: Date) => CalendarEvent[]
}

/**
 * 將 Trip 轉換為 CalendarEvent
 */
function tripToCalendarEvent(trip: Trip): CalendarEvent {
  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    startDate: trip.startDate.toDate(),
    endDate: trip.endDate.toDate(),
    status: trip.status,
    color: STATUS_COLORS[trip.status],
    tripId: trip.id,
  }
}

/**
 * 檢查兩個日期是否為同一天
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * 檢查日期是否在範圍內
 */
function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const dateTime = date.getTime()
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime()
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime()
  return dateTime >= startTime && dateTime <= endTime
}

/**
 * 生成月曆的日期陣列
 */
function generateCalendarDays(
  year: number,
  month: number,
  events: CalendarEvent[],
  selectedDate: Date | null
): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  
  // 計算需要顯示的天數
  const startDay = firstDay.getDay() // 0 (週日) - 6 (週六)
  const totalDays = lastDay.getDate()
  
  // 上個月需要顯示的天數
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  const prevMonthDays = startDay
  
  // 下個月需要顯示的天數
  const totalCells = Math.ceil((prevMonthDays + totalDays) / 7) * 7
  const nextMonthDays = totalCells - prevMonthDays - totalDays
  
  const days: CalendarDay[] = []
  
  // 上個月的日期
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    const dayEvents = events.filter(event =>
      isDateInRange(date, event.startDate, event.endDate)
    )
    
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: dayEvents,
      hasEvents: dayEvents.length > 0,
    })
  }
  
  // 當月的日期
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i)
    const dayEvents = events.filter(event =>
      isDateInRange(date, event.startDate, event.endDate)
    )
    
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: dayEvents,
      hasEvents: dayEvents.length > 0,
    })
  }
  
  // 下個月的日期
  for (let i = 1; i <= nextMonthDays; i++) {
    const date = new Date(year, month + 1, i)
    const dayEvents = events.filter(event =>
      isDateInRange(date, event.startDate, event.endDate)
    )
    
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: dayEvents,
      hasEvents: dayEvents.length > 0,
    })
  }
  
  return days
}

export function useCalendar(): UseCalendarReturn {
  const { trips, tripsLoading } = useTripStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // 將所有行程轉換為日曆事件
  const events = useMemo(() => {
    return trips.map(tripToCalendarEvent)
  }, [trips])
  
  // 生成日曆日期
  const calendarDays = useMemo(() => {
    return generateCalendarDays(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      events,
      selectedDate
    )
  }, [currentMonth, events, selectedDate])
  
  // 取得選中日期的事件
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    return events.filter(event =>
      isDateInRange(selectedDate, event.startDate, event.endDate)
    )
  }, [selectedDate, events])
  
  // 跳轉到今天
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }
  
  // 上一個月
  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }
  
  // 下一個月
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }
  
  // 檢查日期是否有事件
  const hasEvents = (date: Date): boolean => {
    return events.some(event =>
      isDateInRange(date, event.startDate, event.endDate)
    )
  }
  
  // 取得指定日期的事件
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event =>
      isDateInRange(date, event.startDate, event.endDate)
    )
  }
  
  return {
    currentMonth,
    setCurrentMonth,
    calendarDays,
    events,
    eventsLoading: tripsLoading,
    selectedDate,
    setSelectedDate,
    selectedDateEvents,
    goToToday,
    goToPrevMonth,
    goToNextMonth,
    hasEvents,
    getEventsForDate,
  }
}