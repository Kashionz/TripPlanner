import {
  ExpenseForm,
  ExpenseList,
  ExpenseSummaryCard,
  SplitCalculator,
} from '@/components/expense'
import { useExpense, useExpenseSummary } from '@/hooks/useExpense'
import { useDateFormatter, useTrip } from '@/hooks/useTrip'
import { useAuthStore } from '@/stores/authStore'
import type { Expense, ExpenseCategory, ExpenseSplit } from '@/types/expense'
import type { MemberRole } from '@/types/trip'
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  Loader2,
  PieChart,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type TabType = 'list' | 'summary' | 'settlement'

export default function ExpensePage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { trip, loading: tripLoading, error: tripError } = useTrip(id)
  const { formatDateRange } = useDateFormatter()

  // 費用資料
  const {
    expenses,
    allExpenses,
    loading: expensesLoading,
    error: expensesError,
    create,
    update,
    remove,
    filters,
    setCategory,
    setPaidBy,
    setSearchQuery,
    clearFilters,
    hasFilters,
  } = useExpense(id, trip?.members || [])

  // 費用統計
  const { summary, settlements, formatAmount } = useExpenseSummary(
    allExpenses,
    trip?.members || []
  )

  // UI 狀態
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // 權限檢查
  const currentUserMember = trip?.members?.find(m => m.userId === user?.id)
  const currentUserRole: MemberRole | undefined = currentUserMember?.role
  const canEdit = trip?.ownerId === user?.id || currentUserRole === 'editor'

  // 載入狀態
  if (tripLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">載入中...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (tripError || !trip) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{tripError || '行程不存在'}</p>
          <Link to="/dashboard" className="text-primary hover:underline">
            返回儀表板
          </Link>
        </div>
      </div>
    )
  }

  // 處理新增/編輯費用
  const handleSubmit = async (data: {
    title: string
    amount: number
    currency: string
    category: ExpenseCategory
    paidBy: string
    splitAmong: ExpenseSplit[]
  }) => {
    if (editingExpense) {
      await update(editingExpense.id, data)
    } else {
      await create(data)
    }
    setShowForm(false)
    setEditingExpense(null)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDelete = async (expenseId: string) => {
    await remove(expenseId)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-japanese-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link
            to={`/trip/${id}`}
            className="touch-target p-2 rounded-lg hover:bg-background-secondary transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-light text-foreground truncate">
              費用管理
            </h1>
            <div className="text-xs sm:text-sm text-foreground-muted mt-1 truncate">
              {trip.title} · <span className="hidden sm:inline">{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>
          </div>
        </div>

        {/* 新增費用按鈕 */}
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="touch-target flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新增費用</span>
          </button>
        )}
      </div>

      {/* Tabs - 手機版可滾動 */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('list')}
          className={`touch-target flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors flex-shrink-0 ${
            activeTab === 'list'
              ? 'text-primary border-b-2 border-primary'
              : 'text-foreground-muted hover:text-foreground-secondary'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="whitespace-nowrap">費用列表</span>
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`touch-target flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors flex-shrink-0 ${
            activeTab === 'summary'
              ? 'text-primary border-b-2 border-primary'
              : 'text-foreground-muted hover:text-foreground-secondary'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="whitespace-nowrap">費用統計</span>
        </button>
        <button
          onClick={() => setActiveTab('settlement')}
          className={`touch-target flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors flex-shrink-0 ${
            activeTab === 'settlement'
              ? 'text-primary border-b-2 border-primary'
              : 'text-foreground-muted hover:text-foreground-secondary'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span className="whitespace-nowrap">結算</span>
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* 費用列表 Tab */}
          {activeTab === 'list' && (
            <ExpenseList
              expenses={expenses}
              members={trip.members || []}
              loading={expensesLoading}
              onEdit={canEdit ? handleEdit : () => {}}
              onDelete={canEdit ? handleDelete : () => {}}
              filters={filters}
              onFilterChange={
                hasFilters || expenses.length > 0
                  ? (newFilters) => {
                      if (newFilters.category !== undefined) {
                        setCategory(newFilters.category)
                      }
                      if (newFilters.paidBy !== undefined) {
                        setPaidBy(newFilters.paidBy)
                      }
                      if (newFilters.searchQuery !== undefined) {
                        setSearchQuery(newFilters.searchQuery)
                      }
                      if (
                        !newFilters.category &&
                        !newFilters.paidBy &&
                        !newFilters.searchQuery
                      ) {
                        clearFilters()
                      }
                    }
                  : undefined
              }
            />
          )}

          {/* 費用統計 Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* 類別分佈 */}
              <div className="bg-white border border-border rounded-2xl p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  類別分佈
                </h3>
                {summary.byCategory.length === 0 ? (
                  <p className="text-foreground-muted text-center py-8">
                    尚無費用記錄
                  </p>
                ) : (
                  <div className="space-y-3">
                    {summary.byCategory.map((item) => (
                      <div key={item.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">
                            {getCategoryIcon(item.category)} {getCategoryName(item.category)}
                          </span>
                          <span className="text-foreground-secondary">
                            {formatAmount(item.amount)} ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 成員支出 */}
              <div className="bg-white border border-border rounded-2xl p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  成員支出
                </h3>
                {summary.byPayer.length === 0 ? (
                  <p className="text-foreground-muted text-center py-8">
                    尚無成員資料
                  </p>
                ) : (
                  <div className="space-y-3">
                    {summary.byPayer.map((payer) => {
                      const maxPaid = Math.max(...summary.byPayer.map(p => p.totalPaid))
                      const percentage = maxPaid > 0 ? (payer.totalPaid / maxPaid) * 100 : 0
                      
                      return (
                        <div key={payer.userId}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">{payer.displayName}</span>
                            <span className="text-foreground-secondary">
                              {formatAmount(payer.totalPaid)}
                            </span>
                          </div>
                          <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 結算 Tab */}
          {activeTab === 'settlement' && (
            <SplitCalculator
              summary={summary}
              settlements={settlements}
            />
          )}
        </div>

        {/* Sidebar - 手機版隱藏或在頂部顯示摘要 */}
        <div className="space-y-4 sm:space-y-6 desktop-hidden lg:block">
          {/* 費用摘要卡片 */}
          <ExpenseSummaryCard
            totalAmount={summary.totalAmount}
            currency={summary.currency}
            expenseCount={allExpenses.length}
            byCategory={summary.byCategory}
          />

          {/* 成員列表 */}
          <div className="bg-white border border-border rounded-xl p-4">
            <h4 className="font-medium text-foreground mb-3">成員</h4>
            <div className="space-y-2">
              {(trip.members || []).map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-2 text-sm"
                >
                  {member.user?.photoURL ? (
                    <img
                      src={member.user.photoURL}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">
                        {member.user?.displayName?.[0] || '?'}
                      </span>
                    </div>
                  )}
                  <span className="text-foreground">
                    {member.user?.displayName || '未知使用者'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 快速連結 */}
          <div className="bg-white border border-border rounded-xl p-4">
            <h4 className="font-medium text-foreground mb-3">快速連結</h4>
            <div className="space-y-2">
              <Link
                to={`/trip/${id}`}
                className="block text-sm text-primary hover:underline"
              >
                ← 返回行程詳情
              </Link>
              <Link
                to={`/trip/${id}/edit`}
                className="block text-sm text-primary hover:underline"
              >
                編輯行程
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 費用表單 Modal */}
      <ExpenseForm
        members={trip.members || []}
        expense={editingExpense}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      />

      {/* Error Toast */}
      {expensesError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {expensesError}
        </div>
      )}
    </div>
  )
}

// 輔助函式
import { getCategoryIcon, getCategoryName } from '@/services/expenseService'
