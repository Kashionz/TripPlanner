import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  createExpense,
  updateExpense,
  deleteExpense,
  subscribeToTripExpenses,
  calculateExpenseSummary,
  calculateSettlements,
  splitEqually,
  splitByRatio,
  splitByAmount,
  formatAmount,
  getCategoryName,
  getCategoryIcon,
  type CreateExpenseData,
  type UpdateExpenseData,
} from '@/services/expenseService'
import type {
  Expense,
  ExpenseCategory,
  ExpenseSplit,
  ExpenseSummary,
  Settlement,
} from '@/types/expense'
import type { TripMember } from '@/types/trip'

// ==================== 費用列表 Hook ====================

/**
 * 行程費用列表 Hook
 */
export function useTripExpenses(tripId: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  // 訂閱費用變更
  useEffect(() => {
    if (!tripId) {
      setExpenses([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToTripExpenses(tripId, (newExpenses) => {
      setExpenses(newExpenses)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [tripId])

  return {
    expenses,
    loading,
    error,
  }
}

// ==================== 費用操作 Hook ====================

/**
 * 費用 CRUD 操作 Hook
 */
export function useExpenseActions(tripId: string | undefined) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 新增費用
  const create = useCallback(
    async (data: Omit<CreateExpenseData, 'tripId'>) => {
      if (!tripId || !user) {
        throw new Error('請先登入')
      }

      setLoading(true)
      setError(null)
      try {
        const expenseId = await createExpense({
          tripId,
          ...data,
        })
        return expenseId
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [tripId, user]
  )

  // 更新費用
  const update = useCallback(
    async (expenseId: string, data: UpdateExpenseData) => {
      if (!tripId) {
        throw new Error('行程 ID 不存在')
      }

      setLoading(true)
      setError(null)
      try {
        await updateExpense(tripId, expenseId, data)
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [tripId]
  )

  // 刪除費用
  const remove = useCallback(
    async (expenseId: string) => {
      if (!tripId) {
        throw new Error('行程 ID 不存在')
      }

      setLoading(true)
      setError(null)
      try {
        await deleteExpense(tripId, expenseId)
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [tripId]
  )

  return {
    loading,
    error,
    create,
    update,
    remove,
  }
}

// ==================== 費用統計 Hook ====================

/**
 * 費用統計與結算 Hook
 */
export function useExpenseSummary(
  expenses: Expense[],
  members: TripMember[]
) {
  // 計算費用摘要
  const summary = useMemo<ExpenseSummary>(() => {
    return calculateExpenseSummary(expenses, members)
  }, [expenses, members])

  // 計算結算建議
  const settlements = useMemo<Settlement[]>(() => {
    return calculateSettlements(summary)
  }, [summary])

  // 格式化金額
  const format = useCallback(
    (amount: number) => formatAmount(amount, summary.currency),
    [summary.currency]
  )

  return {
    summary,
    settlements,
    formatAmount: format,
  }
}

// ==================== 分攤計算 Hook ====================

/**
 * 分攤方式選擇
 */
export type SplitMethod = 'equal' | 'ratio' | 'custom'

/**
 * 費用分攤 Hook
 */
export function useExpenseSplit(
  amount: number,
  members: TripMember[]
) {
  const [method, setMethod] = useState<SplitMethod>('equal')
  const [ratios, setRatios] = useState<{ userId: string; ratio: number }[]>([])
  const [customAmounts, setCustomAmounts] = useState<{ userId: string; amount: number }[]>([])

  // 初始化比例 (預設平均)
  useEffect(() => {
    if (members.length > 0) {
      setRatios(members.map(m => ({ userId: m.userId, ratio: 1 })))
      setCustomAmounts(members.map(m => ({ userId: m.userId, amount: 0 })))
    }
  }, [members])

  // 計算分攤結果
  const splits = useMemo<ExpenseSplit[]>(() => {
    if (members.length === 0 || amount <= 0) return []

    switch (method) {
      case 'equal':
        return splitEqually(amount, members.map(m => m.userId))
      case 'ratio':
        return splitByRatio(amount, ratios.filter(r => r.ratio > 0))
      case 'custom':
        return splitByAmount(customAmounts.filter(a => a.amount > 0))
      default:
        return splitEqually(amount, members.map(m => m.userId))
    }
  }, [method, amount, members, ratios, customAmounts])

  // 計算總金額 (用於檢查自訂金額是否正確)
  const totalSplitAmount = useMemo(() => {
    return splits.reduce((sum, s) => sum + s.amount, 0)
  }, [splits])

  // 金額差異 (自訂模式下檢查)
  const amountDifference = useMemo(() => {
    return Math.round((amount - totalSplitAmount) * 100) / 100
  }, [amount, totalSplitAmount])

  // 更新單一比例
  const updateRatio = useCallback((userId: string, ratio: number) => {
    setRatios(prev => prev.map(r =>
      r.userId === userId ? { ...r, ratio: Math.max(0, ratio) } : r
    ))
  }, [])

  // 更新單一金額
  const updateCustomAmount = useCallback((userId: string, newAmount: number) => {
    setCustomAmounts(prev => prev.map(a =>
      a.userId === userId ? { ...a, amount: Math.max(0, newAmount) } : a
    ))
  }, [])

  // 重設為平均分攤
  const resetToEqual = useCallback(() => {
    setMethod('equal')
    setRatios(members.map(m => ({ userId: m.userId, ratio: 1 })))
    const equalAmount = amount / members.length
    setCustomAmounts(members.map(m => ({ userId: m.userId, amount: equalAmount })))
  }, [members, amount])

  // 切換成員參與
  const toggleMember = useCallback((userId: string) => {
    if (method === 'equal') {
      // equal 模式下，toggle 會切換到 ratio 模式
      setMethod('ratio')
      setRatios(prev => prev.map(r =>
        r.userId === userId ? { ...r, ratio: r.ratio > 0 ? 0 : 1 } : r
      ))
    } else if (method === 'ratio') {
      setRatios(prev => prev.map(r =>
        r.userId === userId ? { ...r, ratio: r.ratio > 0 ? 0 : 1 } : r
      ))
    } else {
      setCustomAmounts(prev => prev.map(a =>
        a.userId === userId ? { ...a, amount: a.amount > 0 ? 0 : amount / members.length } : a
      ))
    }
  }, [method, amount, members.length])

  return {
    method,
    setMethod,
    ratios,
    customAmounts,
    splits,
    totalSplitAmount,
    amountDifference,
    updateRatio,
    updateCustomAmount,
    resetToEqual,
    toggleMember,
    isValid: method !== 'custom' || Math.abs(amountDifference) < 0.01,
  }
}

// ==================== 費用篩選 Hook ====================

interface ExpenseFilters {
  category?: ExpenseCategory
  paidBy?: string
  dateRange?: {
    start: Date
    end: Date
  }
  searchQuery?: string
}

/**
 * 費用篩選 Hook
 */
export function useExpenseFilters(expenses: Expense[]) {
  const [filters, setFilters] = useState<ExpenseFilters>({})

  // 篩選後的費用
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // 類別篩選
      if (filters.category && expense.category !== filters.category) {
        return false
      }

      // 付款人篩選
      if (filters.paidBy && expense.paidBy !== filters.paidBy) {
        return false
      }

      // 日期範圍篩選
      if (filters.dateRange) {
        const expenseDate = expense.createdAt.toDate()
        if (expenseDate < filters.dateRange.start || expenseDate > filters.dateRange.end) {
          return false
        }
      }

      // 搜尋篩選
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        if (!expense.title.toLowerCase().includes(query)) {
          return false
        }
      }

      return true
    })
  }, [expenses, filters])

  // 更新篩選條件
  const setCategory = useCallback((category: ExpenseCategory | undefined) => {
    setFilters(prev => ({ ...prev, category }))
  }, [])

  const setPaidBy = useCallback((paidBy: string | undefined) => {
    setFilters(prev => ({ ...prev, paidBy }))
  }, [])

  const setDateRange = useCallback((dateRange: { start: Date; end: Date } | undefined) => {
    setFilters(prev => ({ ...prev, dateRange }))
  }, [])

  const setSearchQuery = useCallback((searchQuery: string | undefined) => {
    setFilters(prev => ({ ...prev, searchQuery }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  return {
    filters,
    filteredExpenses,
    setCategory,
    setPaidBy,
    setDateRange,
    setSearchQuery,
    clearFilters,
    hasFilters: Object.values(filters).some(v => v !== undefined),
  }
}

// ==================== 組合 Hook ====================

/**
 * 完整費用功能 Hook
 */
export function useExpense(tripId: string | undefined, members: TripMember[] = []) {
  const { expenses, loading: expensesLoading, error: expensesError } = useTripExpenses(tripId)
  const actions = useExpenseActions(tripId)
  const { summary, settlements, formatAmount: format } = useExpenseSummary(expenses, members)
  const {
    filters,
    filteredExpenses,
    setCategory,
    setPaidBy,
    setSearchQuery,
    clearFilters,
    hasFilters,
  } = useExpenseFilters(expenses)

  return {
    // 資料
    expenses: filteredExpenses,
    allExpenses: expenses,
    loading: expensesLoading || actions.loading,
    error: expensesError || actions.error,
    
    // 操作
    create: actions.create,
    update: actions.update,
    remove: actions.remove,
    
    // 統計
    summary,
    settlements,
    formatAmount: format,
    
    // 篩選
    filters,
    setCategory,
    setPaidBy,
    setSearchQuery,
    clearFilters,
    hasFilters,
  }
}

// ==================== 輔助工具 ====================

export { formatAmount, getCategoryName, getCategoryIcon }