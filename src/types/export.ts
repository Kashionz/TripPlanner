import type { TripWithDetails } from './trip'
import type { Place } from './place'
import type { Expense, ExpenseSummary } from './expense'

// Re-export used types for convenience
export type { TripWithDetails, Place, Expense, ExpenseSummary }

// 匯出格式
export type ExportFormat = 'pdf' | 'csv' | 'image' | 'json'

// 匯出選項
export interface ExportOptions {
  format: ExportFormat
  includeMap?: boolean
  includeExpenses?: boolean
  includeComments?: boolean
  imageQuality?: number // 0-1
  paperSize?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
}

// 匯出資料結構
export interface ExportData {
  trip: TripWithDetails
  places: Place[]
  expenses?: Expense[]
  expenseSummary?: ExpenseSummary
  exportedAt: Date
}

// PDF 匯出設定
export interface PDFExportConfig {
  title: string
  subtitle?: string
  logo?: string
  watermark?: string
  fontSize?: {
    title: number
    heading: number
    body: number
    caption: number
  }
  colors?: {
    primary: string
    secondary: string
    accent: string
    text: string
    muted: string
  }
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// CSV 匯出欄位
export interface CSVExportFields {
  itinerary: (keyof ItineraryCSVRow)[]
  expenses: (keyof ExpenseCSVRow)[]
}

export interface ItineraryCSVRow {
  dayNumber: number
  date: string
  placeName: string
  placeAddress: string
  category: string
  startTime: string
  endTime: string
  duration: string
  note: string
  lat: number
  lng: number
}

export interface ExpenseCSVRow {
  title: string
  amount: number
  currency: string
  category: string
  paidBy: string
  splitCount: number
  createdAt: string
}

// 匯出進度
export interface ExportProgress {
  status: 'idle' | 'preparing' | 'generating' | 'complete' | 'error'
  progress: number // 0-100
  message?: string
  error?: string
}

// 匯出結果
export interface ExportResult {
  success: boolean
  filename?: string
  blob?: Blob
  url?: string
  error?: string
}