import {
  downloadFile,
  exportExpensesToCSV,
  exportItineraryToCSV,
  exportToJSON,
  exportToPDF,
  printContent,
} from '@/services/exportService'
import type { Expense, ExpenseSummary } from '@/types/expense'
import type { ExportFormat, ExportProgress } from '@/types/export'
import type { Place } from '@/types/place'
import type { TripWithDetails } from '@/types/trip'
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  trip: TripWithDetails
  places: Place[]
  expenses?: Expense[]
  expenseSummary?: ExpenseSummary
  printRef?: React.RefObject<HTMLElement>
}

interface ExportOption {
  id: ExportFormat | 'csv-expense' | 'print'
  name: string
  description: string
  icon: React.ReactNode
  disabled?: boolean
}

const exportOptions: ExportOption[] = [
  {
    id: 'pdf',
    name: 'PDF 文件',
    description: '完整行程報告，適合列印或分享',
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: 'csv',
    name: '行程 CSV',
    description: '行程資料表格，可用 Excel 開啟',
    icon: <FileSpreadsheet className="w-6 h-6" />,
  },
  {
    id: 'csv-expense',
    name: '費用 CSV',
    description: '費用明細表格，可用 Excel 開啟',
    icon: <FileSpreadsheet className="w-6 h-6" />,
  },
  {
    id: 'json',
    name: 'JSON 備份',
    description: '完整資料備份，可用於匯入',
    icon: <FileJson className="w-6 h-6" />,
  },
  {
    id: 'print',
    name: '列印',
    description: '直接開啟列印對話框',
    icon: <Printer className="w-6 h-6" />,
  },
]

export default function ExportModal({
  isOpen,
  onClose,
  trip,
  places,
  expenses,
  expenseSummary,
  printRef,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportOption['id'] | null>(null)
  const [includeExpenses, setIncludeExpenses] = useState(true)
  const [progress, setProgress] = useState<ExportProgress>({ status: 'idle', progress: 0 })

  const handleExport = useCallback(async () => {
    if (!selectedFormat) return

    const exportData = {
      trip,
      places,
      expenses: includeExpenses ? expenses : undefined,
      expenseSummary: includeExpenses ? expenseSummary : undefined,
      exportedAt: new Date(),
    }

    setProgress({ status: 'preparing', progress: 0, message: '準備中...' })

    try {
      let result

      switch (selectedFormat) {
        case 'pdf':
          result = await exportToPDF(
            exportData,
            { format: 'pdf', includeExpenses },
            setProgress
          )
          if (result.success) downloadFile(result)
          break

        case 'csv':
          result = await exportItineraryToCSV(exportData, setProgress)
          if (result.success) downloadFile(result)
          break

        case 'csv-expense':
          if (!expenses || expenses.length === 0) {
            setProgress({ status: 'error', progress: 0, error: '沒有費用資料可匯出' })
            return
          }
          result = await exportExpensesToCSV(exportData, setProgress)
          if (result.success) downloadFile(result)
          break

        case 'json':
          result = await exportToJSON(exportData, setProgress)
          if (result.success) downloadFile(result)
          break

        case 'print':
          if (printRef?.current) {
            printContent(printRef.current)
            setProgress({ status: 'complete', progress: 100, message: '已開啟列印對話框' })
          } else {
            setProgress({ status: 'error', progress: 0, error: '無法取得列印內容' })
          }
          break
      }

      if (result && !result.success) {
        setProgress({ status: 'error', progress: 0, error: result.error })
      }
    } catch (error) {
      setProgress({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : '匯出失敗',
      })
    }
  }, [selectedFormat, trip, places, expenses, expenseSummary, includeExpenses, printRef])

  const resetAndClose = () => {
    setSelectedFormat(null)
    setProgress({ status: 'idle', progress: 0 })
    onClose()
  }

  if (!isOpen) return null

  const hasExpenses = expenses && expenses.length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg overflow-hidden animate-japanese-fade-in safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="text-base sm:text-lg font-medium text-foreground">匯出行程</h2>
          <button
            onClick={resetAndClose}
            className="touch-target p-2 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 匯出中狀態 */}
          {progress.status !== 'idle' && progress.status !== 'error' && progress.status !== 'complete' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-foreground-secondary">{progress.message || '處理中...'}</p>
              <div className="mt-4 h-2 bg-background-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 完成狀態 */}
          {progress.status === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">匯出完成！</p>
              <p className="text-foreground-muted text-sm">{progress.message}</p>
              <button
                onClick={resetAndClose}
                className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                關閉
              </button>
            </div>
          )}

          {/* 錯誤狀態 */}
          {progress.status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">匯出失敗</p>
              <p className="text-foreground-muted text-sm">{progress.error}</p>
              <button
                onClick={() => setProgress({ status: 'idle', progress: 0 })}
                className="mt-6 px-6 py-2 border border-border rounded-lg text-foreground-secondary hover:bg-background-secondary transition-colors"
              >
                重試
              </button>
            </div>
          )}

          {/* 選擇格式 */}
          {progress.status === 'idle' && (
            <>
              <div>
                <h3 className="text-sm font-medium text-foreground-secondary mb-3">
                  選擇匯出格式
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {exportOptions.map(option => {
                    const isDisabled =
                      option.disabled ||
                      (option.id === 'csv-expense' && !hasExpenses) ||
                      (option.id === 'print' && !printRef)

                    return (
                      <button
                        key={option.id}
                        onClick={() => !isDisabled && setSelectedFormat(option.id)}
                        disabled={isDisabled}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                          ${
                            selectedFormat === option.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30 hover:bg-background-secondary'
                          }
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div
                          className={`
                            p-3 rounded-lg
                            ${selectedFormat === option.id ? 'bg-primary text-white' : 'bg-background-secondary text-foreground-secondary'}
                          `}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{option.name}</div>
                          <div className="text-sm text-foreground-muted">{option.description}</div>
                        </div>
                        {selectedFormat === option.id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 匯出選項 */}
              {(selectedFormat === 'pdf' || selectedFormat === 'json') && hasExpenses && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-foreground-secondary mb-3">
                    匯出選項
                  </h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExpenses}
                      onChange={e => setIncludeExpenses(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">包含費用資訊</span>
                  </label>
                </div>
              )}

              {/* 行程預覽 */}
              <div className="bg-background-secondary rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">行程名稱</span>
                  <span className="text-foreground font-medium">{trip.title}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-foreground-muted">天數 / 景點</span>
                  <span className="text-foreground">
                    {trip.days?.length || 0} 天 · {places.length} 景點
                  </span>
                </div>
                {hasExpenses && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-foreground-muted">費用筆數</span>
                    <span className="text-foreground">{expenses?.length} 筆</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {progress.status === 'idle' && (
          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-background-secondary">
            <button
              onClick={resetAndClose}
              className="touch-target px-3 sm:px-4 py-2 text-sm sm:text-base text-foreground-secondary hover:text-foreground transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedFormat}
              className={`
                touch-target flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors
                ${
                  selectedFormat
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-background-tertiary text-foreground-muted cursor-not-allowed'
                }
              `}
            >
              <Download className="w-4 h-4" />
              匯出
            </button>
          </div>
        )}
      </div>
    </div>
  )
}