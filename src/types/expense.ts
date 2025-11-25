import { Timestamp } from 'firebase/firestore'

export type ExpenseCategory = 'transport' | 'food' | 'accommodation' | 'ticket' | 'shopping' | 'other'

export interface ExpenseSplit {
  userId: string
  amount: number
  // 使用者資料 (join 查詢用)
  user?: {
    displayName: string
    photoURL: string | null
  }
}

export interface Expense {
  id: string
  tripId: string
  title: string
  amount: number
  currency: string
  category: ExpenseCategory
  paidBy: string // userId
  splitAmong: ExpenseSplit[]
  createdAt: Timestamp
  // 付款人資料 (join 查詢用)
  payer?: {
    displayName: string
    photoURL: string | null
  }
}

// 費用統計
export interface ExpenseSummary {
  totalAmount: number
  currency: string
  byCategory: {
    category: ExpenseCategory
    amount: number
    percentage: number
  }[]
  byPayer: {
    userId: string
    displayName: string
    totalPaid: number
    totalOwed: number
    balance: number // 正數表示應收，負數表示應付
  }[]
}

// 結算建議
export interface Settlement {
  from: {
    userId: string
    displayName: string
  }
  to: {
    userId: string
    displayName: string
  }
  amount: number
  currency: string
}