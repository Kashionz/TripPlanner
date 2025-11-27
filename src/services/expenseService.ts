import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Expense,
  ExpenseCategory,
  ExpenseSplit,
  ExpenseSummary,
  Settlement,
} from '@/types/expense'
import type { TripMember } from '@/types/trip'

// ==================== Expense CRUD ====================

export interface CreateExpenseData {
  tripId: string
  title: string
  amount: number
  currency: string
  category: ExpenseCategory
  paidBy: string
  splitAmong: ExpenseSplit[]
}

export interface UpdateExpenseData {
  title?: string
  amount?: number
  currency?: string
  category?: ExpenseCategory
  paidBy?: string
  splitAmong?: ExpenseSplit[]
}

/**
 * 建立新費用
 */
export async function createExpense(data: CreateExpenseData): Promise<string> {
  const expensesRef = collection(db, 'trips', data.tripId, 'expenses')
  
  const expenseData = {
    title: data.title,
    amount: data.amount,
    currency: data.currency,
    category: data.category,
    paidBy: data.paidBy,
    splitAmong: data.splitAmong,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(expensesRef, expenseData)
  return docRef.id
}

/**
 * 取得單一費用
 */
export async function getExpense(
  tripId: string,
  expenseId: string
): Promise<Expense | null> {
  const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId)
  const expenseSnap = await getDoc(expenseRef)

  if (!expenseSnap.exists()) {
    return null
  }

  const data = expenseSnap.data()
  
  // 取得付款人資料
  const payerRef = doc(db, 'users', data.paidBy)
  const payerSnap = await getDoc(payerRef)
  const payerData = payerSnap.exists() ? payerSnap.data() : null

  // 取得分攤者資料
  const splitAmongWithUsers = await Promise.all(
    data.splitAmong.map(async (split: ExpenseSplit) => {
      const userRef = doc(db, 'users', split.userId)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.exists() ? userSnap.data() : null
      
      return {
        ...split,
        user: userData ? {
          displayName: userData.displayName,
          photoURL: userData.photoURL,
        } : undefined,
      }
    })
  )

  return {
    id: expenseSnap.id,
    tripId,
    ...data,
    splitAmong: splitAmongWithUsers,
    payer: payerData ? {
      displayName: payerData.displayName,
      photoURL: payerData.photoURL,
    } : undefined,
  } as Expense
}

/**
 * 取得行程所有費用
 */
export async function getTripExpenses(tripId: string): Promise<Expense[]> {
  const expensesRef = collection(db, 'trips', tripId, 'expenses')
  const q = query(expensesRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  const expenses: Expense[] = []

  for (const expenseDoc of snapshot.docs) {
    const data = expenseDoc.data()
    
    // 取得付款人資料
    const payerRef = doc(db, 'users', data.paidBy)
    const payerSnap = await getDoc(payerRef)
    const payerData = payerSnap.exists() ? payerSnap.data() : null

    // 取得分攤者資料
    const splitAmongWithUsers = await Promise.all(
      data.splitAmong.map(async (split: ExpenseSplit) => {
        const userRef = doc(db, 'users', split.userId)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.exists() ? userSnap.data() : null
        
        return {
          ...split,
          user: userData ? {
            displayName: userData.displayName,
            photoURL: userData.photoURL,
          } : undefined,
        }
      })
    )

    expenses.push({
      id: expenseDoc.id,
      tripId,
      ...data,
      splitAmong: splitAmongWithUsers,
      payer: payerData ? {
        displayName: payerData.displayName,
        photoURL: payerData.photoURL,
      } : undefined,
    } as Expense)
  }

  return expenses
}

/**
 * 更新費用
 */
export async function updateExpense(
  tripId: string,
  expenseId: string,
  data: UpdateExpenseData
): Promise<void> {
  const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId)
  const updateData: Record<string, unknown> = { ...data }
  await updateDoc(expenseRef, updateData)
}

/**
 * 刪除費用
 */
export async function deleteExpense(
  tripId: string,
  expenseId: string
): Promise<void> {
  const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId)
  await deleteDoc(expenseRef)
}

// ==================== Real-time Subscriptions ====================

/**
 * 訂閱行程費用變更
 */
export function subscribeToTripExpenses(
  tripId: string,
  callback: (expenses: Expense[]) => void
): () => void {
  const expensesRef = collection(db, 'trips', tripId, 'expenses')
  const q = query(expensesRef, orderBy('createdAt', 'desc'))

  return onSnapshot(q, async (snapshot) => {
    const expenses: Expense[] = []

    for (const expenseDoc of snapshot.docs) {
      const data = expenseDoc.data()
      
      // 取得付款人資料
      const payerRef = doc(db, 'users', data.paidBy)
      const payerSnap = await getDoc(payerRef)
      const payerData = payerSnap.exists() ? payerSnap.data() : null

      // 取得分攤者資料
      const splitAmongWithUsers = await Promise.all(
        (data.splitAmong || []).map(async (split: ExpenseSplit) => {
          const userRef = doc(db, 'users', split.userId)
          const userSnap = await getDoc(userRef)
          const userData = userSnap.exists() ? userSnap.data() : null
          
          return {
            ...split,
            user: userData ? {
              displayName: userData.displayName,
              photoURL: userData.photoURL,
            } : undefined,
          }
        })
      )

      expenses.push({
        id: expenseDoc.id,
        tripId,
        ...data,
        splitAmong: splitAmongWithUsers,
        payer: payerData ? {
          displayName: payerData.displayName,
          photoURL: payerData.photoURL,
        } : undefined,
      } as Expense)
    }

    callback(expenses)
  })
}

// ==================== 費用統計與計算 ====================

/**
 * 計算費用摘要
 */
export function calculateExpenseSummary(
  expenses: Expense[],
  members: TripMember[]
): ExpenseSummary {
  if (expenses.length === 0) {
    return {
      totalAmount: 0,
      currency: 'TWD',
      byCategory: [],
      byPayer: members.map(member => ({
        userId: member.userId,
        displayName: member.user?.displayName || '未知使用者',
        totalPaid: 0,
        totalOwed: 0,
        balance: 0,
      })),
    }
  }

  // 取得主要幣別 (使用最常出現的)
  const currencyCount: Record<string, number> = {}
  expenses.forEach(expense => {
    currencyCount[expense.currency] = (currencyCount[expense.currency] || 0) + 1
  })
  const mainCurrency = Object.entries(currencyCount)
    .sort(([, a], [, b]) => b - a)[0][0]

  // 計算總金額
  const totalAmount = expenses
    .filter(e => e.currency === mainCurrency)
    .reduce((sum, e) => sum + e.amount, 0)

  // 按類別統計
  const categoryTotals: Record<ExpenseCategory, number> = {
    transport: 0,
    food: 0,
    accommodation: 0,
    ticket: 0,
    shopping: 0,
    other: 0,
  }
  
  expenses
    .filter(e => e.currency === mainCurrency)
    .forEach(expense => {
      categoryTotals[expense.category] += expense.amount
    })

  const byCategory = Object.entries(categoryTotals)
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category: category as ExpenseCategory,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // 按付款人統計
  const payerStats: Record<string, { paid: number; owed: number }> = {}
  
  // 初始化所有成員
  members.forEach(member => {
    payerStats[member.userId] = { paid: 0, owed: 0 }
  })

  // 計算每個人的支付和應付
  expenses
    .filter(e => e.currency === mainCurrency)
    .forEach(expense => {
      // 付款人支付的金額
      if (payerStats[expense.paidBy]) {
        payerStats[expense.paidBy].paid += expense.amount
      }

      // 每個分攤者應付的金額
      expense.splitAmong.forEach(split => {
        if (payerStats[split.userId]) {
          payerStats[split.userId].owed += split.amount
        }
      })
    })

  const byPayer = members.map(member => ({
    userId: member.userId,
    displayName: member.user?.displayName || '未知使用者',
    totalPaid: payerStats[member.userId]?.paid || 0,
    totalOwed: payerStats[member.userId]?.owed || 0,
    balance: (payerStats[member.userId]?.paid || 0) - (payerStats[member.userId]?.owed || 0),
  }))

  return {
    totalAmount,
    currency: mainCurrency,
    byCategory,
    byPayer,
  }
}

/**
 * 計算結算建議（最小化轉帳次數）
 */
export function calculateSettlements(
  summary: ExpenseSummary
): Settlement[] {
  const settlements: Settlement[] = []
  
  // 取得需要付款的人（balance < 0）和需要收款的人（balance > 0）
  const debtors = summary.byPayer
    .filter(p => p.balance < 0)
    .map(p => ({
      userId: p.userId,
      displayName: p.displayName,
      amount: Math.abs(p.balance),
    }))
    .sort((a, b) => b.amount - a.amount)

  const creditors = summary.byPayer
    .filter(p => p.balance > 0)
    .map(p => ({
      userId: p.userId,
      displayName: p.displayName,
      amount: p.balance,
    }))
    .sort((a, b) => b.amount - a.amount)

  // 貪婪演算法：從最大債務開始配對
  let debtorIndex = 0
  let creditorIndex = 0

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    
    // 計算轉帳金額
    const settlementAmount = Math.min(debtor.amount, creditor.amount)
    
    if (settlementAmount > 0) {
      settlements.push({
        from: {
          userId: debtor.userId,
          displayName: debtor.displayName,
        },
        to: {
          userId: creditor.userId,
          displayName: creditor.displayName,
        },
        amount: Math.round(settlementAmount * 100) / 100, // 四捨五入到小數點後兩位
        currency: summary.currency,
      })
    }

    // 更新餘額
    debtor.amount -= settlementAmount
    creditor.amount -= settlementAmount

    // 移動索引
    if (debtor.amount <= 0.01) debtorIndex++
    if (creditor.amount <= 0.01) creditorIndex++
  }

  return settlements
}

/**
 * 平均分攤費用
 */
export function splitEqually(
  amount: number,
  userIds: string[]
): ExpenseSplit[] {
  const splitAmount = amount / userIds.length
  
  return userIds.map(userId => ({
    userId,
    amount: Math.round(splitAmount * 100) / 100, // 四捨五入到小數點後兩位
  }))
}

/**
 * 按比例分攤費用
 */
export function splitByRatio(
  amount: number,
  ratios: { userId: string; ratio: number }[]
): ExpenseSplit[] {
  const totalRatio = ratios.reduce((sum, r) => sum + r.ratio, 0)
  
  return ratios.map(({ userId, ratio }) => ({
    userId,
    amount: Math.round((amount * ratio / totalRatio) * 100) / 100,
  }))
}

/**
 * 自訂金額分攤
 */
export function splitByAmount(
  splits: { userId: string; amount: number }[]
): ExpenseSplit[] {
  return splits.map(({ userId, amount }) => ({
    userId,
    amount: Math.round(amount * 100) / 100,
  }))
}

// ==================== 輔助函式 ====================

/**
 * 取得費用類別名稱
 */
export function getCategoryName(category: ExpenseCategory): string {
  const names: Record<ExpenseCategory, string> = {
    transport: '交通',
    food: '餐飲',
    accommodation: '住宿',
    ticket: '門票',
    shopping: '購物',
    other: '其他',
  }
  return names[category] || '未知'
}

/**
 * 取得費用類別圖示
 */
export function getCategoryIcon(category: ExpenseCategory): string {
  const icons: Record<ExpenseCategory, string> = {
    transport: '🚗',
    food: '🍽️',
    accommodation: '🏨',
    ticket: '🎫',
    shopping: '🛒',
    other: '📝',
  }
  return icons[category] || '📝'
}

/**
 * 格式化金額顯示
 */
export function formatAmount(amount: number, currency: string = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * 格式化費用建立時間
 */
export function formatExpenseDate(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  return date.toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 支援的幣別列表
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '歐元', symbol: '€' },
  { code: 'JPY', name: '日圓', symbol: '¥' },
  { code: 'KRW', name: '韓元', symbol: '₩' },
  { code: 'CNY', name: '人民幣', symbol: '¥' },
  { code: 'HKD', name: '港幣', symbol: 'HK$' },
  { code: 'GBP', name: '英鎊', symbol: '£' },
  { code: 'THB', name: '泰銖', symbol: '฿' },
  { code: 'SGD', name: '新加坡幣', symbol: 'S$' },
]

/**
 * 費用類別列表
 */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'transport',
  'food',
  'accommodation',
  'ticket',
  'shopping',
  'other',
]