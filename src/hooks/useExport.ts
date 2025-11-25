import { useState, useCallback } from 'react'
import type { TripWithDetails } from '@/types/trip'
import type { Place } from '@/types/place'
import type { Expense, ExpenseSummary } from '@/types/expense'
import type { ExportProgress, ExportResult, ExportOptions } from '@/types/export'
import {
  exportToPDF,
  exportItineraryToCSV,
  exportExpensesToCSV,
  exportToJSON,
  exportToImage,
  downloadFile,
} from '@/services/exportService'

interface UseExportOptions {
  trip: TripWithDetails | null
  places: Place[]
  expenses?: Expense[]
  expenseSummary?: ExpenseSummary
}

export function useExport({ trip, places, expenses, expenseSummary }: UseExportOptions) {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress>({ status: 'idle', progress: 0 })
  const [lastResult, setLastResult] = useState<ExportResult | null>(null)

  const createExportData = useCallback(() => {
    if (!trip) return null
    return {
      trip,
      places,
      expenses,
      expenseSummary,
      exportedAt: new Date(),
    }
  }, [trip, places, expenses, expenseSummary])

  const exportPDF = useCallback(
    async (options?: Partial<ExportOptions>) => {
      const data = createExportData()
      if (!data) return null

      setIsExporting(true)
      try {
        const result = await exportToPDF(
          data,
          { format: 'pdf', ...options },
          setProgress
        )
        setLastResult(result)
        if (result.success) {
          downloadFile(result)
        }
        return result
      } finally {
        setIsExporting(false)
      }
    },
    [createExportData]
  )

  const exportItineraryCSV = useCallback(async () => {
    const data = createExportData()
    if (!data) return null

    setIsExporting(true)
    try {
      const result = await exportItineraryToCSV(data, setProgress)
      setLastResult(result)
      if (result.success) {
        downloadFile(result)
      }
      return result
    } finally {
      setIsExporting(false)
    }
  }, [createExportData])

  const exportExpenseCSV = useCallback(async () => {
    const data = createExportData()
    if (!data) return null

    setIsExporting(true)
    try {
      const result = await exportExpensesToCSV(data, setProgress)
      setLastResult(result)
      if (result.success) {
        downloadFile(result)
      }
      return result
    } finally {
      setIsExporting(false)
    }
  }, [createExportData])

  const exportJSON = useCallback(async () => {
    const data = createExportData()
    if (!data) return null

    setIsExporting(true)
    try {
      const result = await exportToJSON(data, setProgress)
      setLastResult(result)
      if (result.success) {
        downloadFile(result)
      }
      return result
    } finally {
      setIsExporting(false)
    }
  }, [createExportData])

  const exportImage = useCallback(
    async (element: HTMLElement, filename?: string) => {
      if (!trip) return null

      setIsExporting(true)
      try {
        const result = await exportToImage(
          element,
          filename || trip.title,
          {},
          setProgress
        )
        setLastResult(result)
        if (result.success) {
          downloadFile(result)
        }
        return result
      } finally {
        setIsExporting(false)
      }
    },
    [trip]
  )

  const resetProgress = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 })
    setLastResult(null)
  }, [])

  return {
    isExporting,
    progress,
    lastResult,
    exportPDF,
    exportItineraryCSV,
    exportExpenseCSV,
    exportJSON,
    exportImage,
    resetProgress,
  }
}

export default useExport