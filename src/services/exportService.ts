import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { Place, PlaceCategory } from '@/types/place'
import type { ExpenseCategory } from '@/types/expense'
import type {
  ExportOptions,
  ExportData,
  PDFExportConfig,
  ExportResult,
  ExportProgress,
} from '@/types/export'

// ==================== 工具函式 ====================

/**
 * 格式化日期
 */
function formatDate(timestamp: any): string {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'yyyy/MM/dd (EEEE)', { locale: zhTW })
}

/**
 * 格式化時間
 */
function formatTime(time: string | null): string {
  return time || '--:--'
}

/**
 * 格式化時長
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分鐘`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} 小時 ${mins} 分鐘` : `${hours} 小時`
}

/**
 * 取得類別顯示名稱
 */
function getCategoryName(category: PlaceCategory | ExpenseCategory): string {
  const categoryMap: Record<string, string> = {
    // Place categories
    attraction: '景點',
    restaurant: '餐廳',
    hotel: '住宿',
    transport: '交通',
    other: '其他',
    // Expense categories
    food: '餐飲',
    accommodation: '住宿',
    ticket: '門票',
    shopping: '購物',
  }
  return categoryMap[category] || category
}

/**
 * 產生安全的檔名
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
}

// ==================== PDF 匯出 ====================

const defaultPDFConfig: PDFExportConfig = {
  title: '旅遊行程',
  fontSize: {
    title: 24,
    heading: 16,
    body: 12,
    caption: 10,
  },
  colors: {
    primary: '#5B7B7A',
    secondary: '#8B9D83',
    accent: '#C4A35A',
    text: '#2D2D2D',
    muted: '#8C8C8C',
  },
  margins: {
    top: 20,
    right: 15,
    bottom: 20,
    left: 15,
  },
}

/**
 * 匯出 PDF
 */
export async function exportToPDF(
  data: ExportData,
  options: ExportOptions = { format: 'pdf' },
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  try {
    onProgress?.({ status: 'preparing', progress: 0, message: '準備匯出資料...' })

    const { trip, places, expenses, expenseSummary } = data
    const config = { ...defaultPDFConfig, title: trip.title }
    
    // 建立 PDF 文件
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.paperSize || 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const { margins } = config
    const contentWidth = pageWidth - margins!.left - margins!.right
    let y = margins!.top

    // 設定中文字體 (使用內建字體，支援基本中文)
    // 注意：完整中文支援需要加載中文字體檔案
    
    onProgress?.({ status: 'generating', progress: 10, message: '生成封面...' })

    // === 封面 ===
    pdf.setFontSize(config.fontSize!.title)
    pdf.setTextColor(config.colors!.primary)
    pdf.text(trip.title, pageWidth / 2, pageHeight / 3, { align: 'center' })

    pdf.setFontSize(config.fontSize!.body)
    pdf.setTextColor(config.colors!.muted)
    const dateRange = `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
    pdf.text(dateRange, pageWidth / 2, pageHeight / 3 + 15, { align: 'center' })

    if (trip.description) {
      pdf.setFontSize(config.fontSize!.caption)
      const descLines = pdf.splitTextToSize(trip.description, contentWidth * 0.8)
      pdf.text(descLines, pageWidth / 2, pageHeight / 3 + 30, { align: 'center' })
    }

    // 統計資訊
    const stats = `${trip.days?.length || 0} 天 · ${places.length} 景點`
    pdf.text(stats, pageWidth / 2, pageHeight / 3 + 50, { align: 'center' })

    // 匯出時間
    pdf.setFontSize(8)
    pdf.text(
      `匯出時間：${format(data.exportedAt, 'yyyy/MM/dd HH:mm')}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    )

    onProgress?.({ status: 'generating', progress: 30, message: '生成行程內容...' })

    // === 行程內容 ===
    pdf.addPage()
    y = margins!.top

    // 行程標題
    pdf.setFontSize(config.fontSize!.heading)
    pdf.setTextColor(config.colors!.text)
    pdf.text('行程安排', margins!.left, y)
    y += 10

    // 按天數排列
    const sortedDays = [...(trip.days || [])].sort((a, b) => a.dayNumber - b.dayNumber)
    const placesByDay = new Map<string, Place[]>()
    places.forEach(place => {
      const dayPlaces = placesByDay.get(place.dayId) || []
      dayPlaces.push(place)
      placesByDay.set(place.dayId, dayPlaces)
    })

    let dayIndex = 0
    for (const day of sortedDays) {
      // 檢查是否需要換頁
      if (y > pageHeight - 50) {
        pdf.addPage()
        y = margins!.top
      }

      // 日期標題
      pdf.setFontSize(config.fontSize!.body)
      pdf.setTextColor(config.colors!.primary)
      pdf.text(`Day ${day.dayNumber} - ${formatDate(day.date)}`, margins!.left, y)
      y += 8

      // 該日景點
      const dayPlaces = (placesByDay.get(day.id) || []).sort((a, b) => a.order - b.order)
      
      if (dayPlaces.length === 0) {
        pdf.setFontSize(config.fontSize!.caption)
        pdf.setTextColor(config.colors!.muted)
        pdf.text('尚無安排', margins!.left + 5, y)
        y += 8
      } else {
        for (const place of dayPlaces) {
          // 檢查是否需要換頁
          if (y > pageHeight - 30) {
            pdf.addPage()
            y = margins!.top
          }

          // 景點名稱
          pdf.setFontSize(config.fontSize!.body)
          pdf.setTextColor(config.colors!.text)
          const timeStr = place.startTime ? `${formatTime(place.startTime)}` : ''
          const placeTitle = timeStr ? `${timeStr} ${place.name}` : place.name
          pdf.text(placeTitle, margins!.left + 5, y)
          y += 5

          // 景點詳情
          pdf.setFontSize(config.fontSize!.caption)
          pdf.setTextColor(config.colors!.muted)
          const details = `${getCategoryName(place.category)} · ${formatDuration(place.duration)}`
          pdf.text(details, margins!.left + 5, y)
          y += 4

          // 地址
          if (place.address) {
            const addressLines = pdf.splitTextToSize(place.address, contentWidth - 10)
            pdf.text(addressLines, margins!.left + 5, y)
            y += addressLines.length * 4
          }

          // 備註
          if (place.note) {
            pdf.setTextColor(config.colors!.secondary)
            const noteLines = pdf.splitTextToSize(`備註：${place.note}`, contentWidth - 10)
            pdf.text(noteLines, margins!.left + 5, y)
            y += noteLines.length * 4
          }

          y += 5
        }
      }

      // 日期備註
      if (day.note) {
        pdf.setFontSize(config.fontSize!.caption)
        pdf.setTextColor(config.colors!.secondary)
        const noteLines = pdf.splitTextToSize(`日記：${day.note}`, contentWidth - 5)
        pdf.text(noteLines, margins!.left, y)
        y += noteLines.length * 4
      }

      y += 10
      dayIndex++
      onProgress?.({
        status: 'generating',
        progress: 30 + (dayIndex / sortedDays.length) * 30,
        message: `生成 Day ${day.dayNumber}...`,
      })
    }

    // === 費用資訊 ===
    if (options.includeExpenses && expenses && expenses.length > 0) {
      onProgress?.({ status: 'generating', progress: 70, message: '生成費用報告...' })

      pdf.addPage()
      y = margins!.top

      pdf.setFontSize(config.fontSize!.heading)
      pdf.setTextColor(config.colors!.text)
      pdf.text('費用明細', margins!.left, y)
      y += 10

      // 費用總計
      if (expenseSummary) {
        pdf.setFontSize(config.fontSize!.body)
        pdf.setTextColor(config.colors!.primary)
        pdf.text(
          `總計：${expenseSummary.currency} ${expenseSummary.totalAmount.toLocaleString()}`,
          margins!.left,
          y
        )
        y += 10

        // 分類統計
        pdf.setFontSize(config.fontSize!.caption)
        pdf.setTextColor(config.colors!.muted)
        for (const cat of expenseSummary.byCategory) {
          pdf.text(
            `${getCategoryName(cat.category)}：${expenseSummary.currency} ${cat.amount.toLocaleString()} (${cat.percentage.toFixed(1)}%)`,
            margins!.left,
            y
          )
          y += 5
        }
        y += 5
      }

      // 費用列表
      pdf.setFontSize(config.fontSize!.caption)
      for (const expense of expenses) {
        if (y > pageHeight - 20) {
          pdf.addPage()
          y = margins!.top
        }

        pdf.setTextColor(config.colors!.text)
        pdf.text(`${expense.title}`, margins!.left, y)
        pdf.text(
          `${expense.currency} ${expense.amount.toLocaleString()}`,
          pageWidth - margins!.right,
          y,
          { align: 'right' }
        )
        y += 4

        pdf.setTextColor(config.colors!.muted)
        const expenseInfo = `${getCategoryName(expense.category)} · ${expense.payer?.displayName || '未知'} 付款`
        pdf.text(expenseInfo, margins!.left, y)
        y += 6
      }
    }

    onProgress?.({ status: 'generating', progress: 90, message: '完成中...' })

    // 產生檔案
    const filename = `${sanitizeFilename(trip.title)}_行程.pdf`
    const blob = pdf.output('blob')

    onProgress?.({ status: 'complete', progress: 100, message: '匯出完成！' })

    return {
      success: true,
      filename,
      blob,
      url: URL.createObjectURL(blob),
    }
  } catch (error) {
    console.error('PDF 匯出失敗:', error)
    onProgress?.({ status: 'error', progress: 0, error: String(error) })
    return {
      success: false,
      error: error instanceof Error ? error.message : '匯出失敗',
    }
  }
}

// ==================== CSV 匯出 ====================

/**
 * 將資料轉換為 CSV 格式
 */
function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number) => {
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = headers.map(escape).join(',')
  const dataLines = rows.map(row => row.map(escape).join(','))
  
  // 加入 BOM 以支援 Excel 開啟 UTF-8
  return '\uFEFF' + [headerLine, ...dataLines].join('\n')
}

/**
 * 匯出行程 CSV
 */
export async function exportItineraryToCSV(
  data: ExportData,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  try {
    onProgress?.({ status: 'preparing', progress: 0, message: '準備匯出資料...' })

    const { trip, places } = data
    const headers = ['天數', '日期', '景點名稱', '地址', '類別', '開始時間', '結束時間', '停留時間', '備註', '緯度', '經度']
    
    const sortedDays = [...(trip.days || [])].sort((a, b) => a.dayNumber - b.dayNumber)
    const dayMap = new Map(sortedDays.map(d => [d.id, d]))
    
    const rows: (string | number)[][] = []
    
    const sortedPlaces = [...places].sort((a, b) => {
      const dayA = dayMap.get(a.dayId)
      const dayB = dayMap.get(b.dayId)
      if (!dayA || !dayB) return 0
      if (dayA.dayNumber !== dayB.dayNumber) return dayA.dayNumber - dayB.dayNumber
      return a.order - b.order
    })

    onProgress?.({ status: 'generating', progress: 30, message: '生成 CSV...' })

    for (const place of sortedPlaces) {
      const day = dayMap.get(place.dayId)
      if (!day) continue

      rows.push([
        day.dayNumber,
        formatDate(day.date),
        place.name,
        place.address,
        getCategoryName(place.category),
        formatTime(place.startTime),
        formatTime(place.endTime),
        formatDuration(place.duration),
        place.note || '',
        place.lat,
        place.lng,
      ])
    }

    const csv = toCSV(headers, rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const filename = `${sanitizeFilename(trip.title)}_行程.csv`

    onProgress?.({ status: 'complete', progress: 100, message: '匯出完成！' })

    return {
      success: true,
      filename,
      blob,
      url: URL.createObjectURL(blob),
    }
  } catch (error) {
    console.error('CSV 匯出失敗:', error)
    onProgress?.({ status: 'error', progress: 0, error: String(error) })
    return {
      success: false,
      error: error instanceof Error ? error.message : '匯出失敗',
    }
  }
}

/**
 * 匯出費用 CSV
 */
export async function exportExpensesToCSV(
  data: ExportData,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  try {
    onProgress?.({ status: 'preparing', progress: 0, message: '準備匯出資料...' })

    const { trip, expenses } = data
    if (!expenses || expenses.length === 0) {
      return { success: false, error: '沒有費用資料可匯出' }
    }

    const headers = ['項目', '金額', '貨幣', '類別', '付款人', '分攤人數', '建立時間']
    
    onProgress?.({ status: 'generating', progress: 30, message: '生成 CSV...' })

    const rows: (string | number)[][] = expenses.map(expense => [
      expense.title,
      expense.amount,
      expense.currency,
      getCategoryName(expense.category),
      expense.payer?.displayName || '未知',
      expense.splitAmong.length,
      expense.createdAt ? format(expense.createdAt.toDate(), 'yyyy/MM/dd HH:mm') : '',
    ])

    const csv = toCSV(headers, rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const filename = `${sanitizeFilename(trip.title)}_費用.csv`

    onProgress?.({ status: 'complete', progress: 100, message: '匯出完成！' })

    return {
      success: true,
      filename,
      blob,
      url: URL.createObjectURL(blob),
    }
  } catch (error) {
    console.error('CSV 匯出失敗:', error)
    onProgress?.({ status: 'error', progress: 0, error: String(error) })
    return {
      success: false,
      error: error instanceof Error ? error.message : '匯出失敗',
    }
  }
}

// ==================== 圖片匯出 ====================

/**
 * 將 DOM 元素匯出為圖片
 */
export async function exportToImage(
  element: HTMLElement,
  filename: string,
  options: {
    scale?: number
    backgroundColor?: string
    quality?: number
  } = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  try {
    onProgress?.({ status: 'preparing', progress: 0, message: '準備截圖...' })

    const { scale = 2, backgroundColor = '#ffffff', quality = 0.95 } = options

    onProgress?.({ status: 'generating', progress: 30, message: '生成圖片...' })

    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
    })

    onProgress?.({ status: 'generating', progress: 80, message: '處理圖片...' })

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) resolve(blob)
          else reject(new Error('無法生成圖片'))
        },
        'image/png',
        quality
      )
    })

    const safeFilename = `${sanitizeFilename(filename)}.png`

    onProgress?.({ status: 'complete', progress: 100, message: '匯出完成！' })

    return {
      success: true,
      filename: safeFilename,
      blob,
      url: URL.createObjectURL(blob),
    }
  } catch (error) {
    console.error('圖片匯出失敗:', error)
    onProgress?.({ status: 'error', progress: 0, error: String(error) })
    return {
      success: false,
      error: error instanceof Error ? error.message : '匯出失敗',
    }
  }
}

// ==================== JSON 匯出 ====================

/**
 * 匯出 JSON 資料
 */
export async function exportToJSON(
  data: ExportData,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  try {
    onProgress?.({ status: 'generating', progress: 50, message: '生成 JSON...' })

    // 清理資料，移除 Firebase 特定的欄位
    const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (key === 'user' || key === 'payer') return value // 保留使用者資訊
      if (value && typeof value === 'object' && 'seconds' in value) {
        // 轉換 Timestamp
        return new Date(value.seconds * 1000).toISOString()
      }
      return value
    }))

    const json = JSON.stringify(cleanData, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const filename = `${sanitizeFilename(data.trip.title)}_backup.json`

    onProgress?.({ status: 'complete', progress: 100, message: '匯出完成！' })

    return {
      success: true,
      filename,
      blob,
      url: URL.createObjectURL(blob),
    }
  } catch (error) {
    console.error('JSON 匯出失敗:', error)
    onProgress?.({ status: 'error', progress: 0, error: String(error) })
    return {
      success: false,
      error: error instanceof Error ? error.message : '匯出失敗',
    }
  }
}

// ==================== 下載工具 ====================

/**
 * 下載檔案
 */
export function downloadFile(result: ExportResult): void {
  if (!result.success || !result.blob || !result.filename) {
    console.error('無法下載檔案:', result.error)
    return
  }

  saveAs(result.blob, result.filename)
}

/**
 * 開啟列印對話框
 */
export function printContent(element: HTMLElement): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('無法開啟列印視窗，請檢查瀏覽器設定')
    return
  }

  // 複製樣式
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      } catch {
        return ''
      }
    })
    .join('\n')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>列印行程</title>
        <style>
          ${styles}
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}