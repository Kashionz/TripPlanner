import { TripStatus } from './trip'

export interface CalendarEvent {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  status: TripStatus
  color: string
  tripId: string
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: CalendarEvent[]
  hasEvents: boolean
}

export interface CalendarMonth {
  year: number
  month: number // 0-11
  days: CalendarDay[]
}