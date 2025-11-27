import { Trip } from '@/types/trip'
import { format } from 'date-fns'

/**
 * 日曆匯出服務
 * 支援匯出為 iCal (.ics) 格式
 */

/**
 * 生成 iCal 格式字串
 */
function generateICalString(trips: Trip[]): string {
  const now = new Date()
  const timestamp = format(now, "yyyyMMdd'T'HHmmss'Z'")
  
  // iCal 檔案標頭
  let ical = 'BEGIN:VCALENDAR\r\n'
  ical += 'VERSION:2.0\r\n'
  ical += 'PRODID:-//TripPlanner//Travel Calendar//EN\r\n'
  ical += 'CALSCALE:GREGORIAN\r\n'
  ical += 'METHOD:PUBLISH\r\n'
  ical += 'X-WR-CALNAME:TripPlanner 行程\r\n'
  ical += 'X-WR-TIMEZONE:Asia/Taipei\r\n'
  ical += 'X-WR-CALDESC:從 TripPlanner 匯出的旅遊行程\r\n'
  
  // 為每個行程建立事件
  trips.forEach((trip) => {
    const uid = `trip-${trip.id}@tripplanner.app`
    const dtstart = format(trip.startDate.toDate(), "yyyyMMdd'T'000000'Z'")
    const dtend = format(trip.endDate.toDate(), "yyyyMMdd'T'235959'Z'")
    const created = timestamp
    const lastModified = trip.updatedAt 
      ? format(trip.updatedAt.toDate(), "yyyyMMdd'T'HHmmss'Z'")
      : timestamp
    
    // 狀態對應
    const statusMap = {
      planning: '規劃中',
      ongoing: '進行中', 
      completed: '已完成'
    }
    
    // 建立描述
    let description = trip.description || ''
    if (trip.status) {
      description += `\\n\\n狀態: ${statusMap[trip.status]}`
    }
    
    // 建立事件
    ical += 'BEGIN:VEVENT\r\n'
    ical += `UID:${uid}\r\n`
    ical += `DTSTAMP:${created}\r\n`
    ical += `DTSTART;VALUE=DATE:${dtstart.split('T')[0]}\r\n`
    ical += `DTEND;VALUE=DATE:${dtend.split('T')[0]}\r\n`
    ical += `SUMMARY:${escapeICalText(trip.title)}\r\n`
    
    if (description) {
      ical += `DESCRIPTION:${escapeICalText(description)}\r\n`
    }
    
    ical += `CREATED:${created}\r\n`
    ical += `LAST-MODIFIED:${lastModified}\r\n`
    ical += `STATUS:CONFIRMED\r\n`
    ical += `TRANSP:OPAQUE\r\n`
    
    // 添加分類
    ical += `CATEGORIES:旅遊,行程\r\n`
    
    // 添加提醒 (行程開始前一天)
    ical += 'BEGIN:VALARM\r\n'
    ical += 'TRIGGER:-P1D\r\n'
    ical += 'ACTION:DISPLAY\r\n'
    ical += `DESCRIPTION:行程提醒: ${escapeICalText(trip.title)}\r\n`
    ical += 'END:VALARM\r\n'
    
    ical += 'END:VEVENT\r\n'
  })
  
  ical += 'END:VCALENDAR\r\n'
  
  return ical
}

/**
 * 轉義 iCal 文字特殊字元
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * 匯出行程為 iCal 檔案
 */
export async function exportToICal(trips: Trip[]): Promise<void> {
  try {
    if (trips.length === 0) {
      throw new Error('沒有可匯出的行程')
    }
    
    // 生成 iCal 內容
    const icalContent = generateICalString(trips)
    
    // 建立 Blob
    const blob = new Blob([icalContent], { 
      type: 'text/calendar;charset=utf-8' 
    })
    
    // 建立下載連結
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tripplanner-${format(new Date(), 'yyyy-MM-dd')}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('[Calendar Export] iCal 匯出成功')
  } catch (error) {
    console.error('[Calendar Export] iCal 匯出失敗:', error)
    throw error
  }
}

/**
 * 匯出單一行程為 iCal
 */
export async function exportTripToICal(trip: Trip): Promise<void> {
  return exportToICal([trip])
}

/**
 * 生成 iCal 檔案內容（用於預覽或其他用途）
 */
export function generateICalContent(trips: Trip[]): string {
  return generateICalString(trips)
}