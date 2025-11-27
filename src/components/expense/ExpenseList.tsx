import { useState } from 'react'
import {
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Receipt,
  Loader2,
} from 'lucide-react'
import type { Expense, ExpenseCategory } from '@/types/expense'
import type { TripMember } from '@/types/trip'
import {
  getCategoryName,
  getCategoryIcon,
  formatAmount,
  formatExpenseDate,
  EXPENSE_CATEGORIES,
} from '@/services/expenseService'

interface ExpenseListProps {
  expenses: Expense[]
  members: TripMember[]
  loading?: boolean
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
  // 篩選
  filters?: {
    category?: ExpenseCategory
    paidBy?: string
    searchQuery?: string
  }
  onFilterChange?: (filters: {
    category?: ExpenseCategory
    paidBy?: string
    searchQuery?: string
  }) => void
}

export default function ExpenseList({
  expenses,
  members,
  loading,
  onEdit,
  onDelete,
  filters = {},
  onFilterChange,
}: ExpenseListProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId)
    try {
      await onDelete(expenseId)
    } finally {
      setDeletingId(null)
    }
  }

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.userId === userId)
    return member?.user?.displayName || '未知使用者'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-foreground-muted">載入費用中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 搜尋與篩選 */}
      {onFilterChange && (
        <div className="space-y-3">
          {/* 搜尋框 */}
          <div className="relative">
            <Search className="w-5 h-5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, searchQuery: e.target.value || undefined })
              }
              placeholder="搜尋費用..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* 篩選按鈕 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <Filter className="w-4 h-4" />
            篩選條件
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* 篩選選項 */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 bg-background-secondary rounded-xl">
              {/* 類別篩選 */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-foreground-muted mb-1">
                  類別
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      category: (e.target.value || undefined) as ExpenseCategory | undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">全部類別</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {getCategoryName(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 付款人篩選 */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-foreground-muted mb-1">
                  付款人
                </label>
                <select
                  value={filters.paidBy || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      paidBy: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">全部成員</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user?.displayName || '未知使用者'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 清除篩選 */}
              {(filters.category || filters.paidBy || filters.searchQuery) && (
                <button
                  onClick={() => onFilterChange({})}
                  className="self-end px-3 py-2 text-sm text-primary hover:underline"
                >
                  清除篩選
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 費用列表 */}
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="w-12 h-12 text-foreground-muted mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            尚無費用記錄
          </h3>
          <p className="text-foreground-muted text-sm">
            點擊「新增費用」開始記錄支出
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              isExpanded={expandedId === expense.id}
              isDeleting={deletingId === expense.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === expense.id ? null : expense.id)
              }
              onEdit={() => onEdit(expense)}
              onDelete={() => handleDelete(expense.id)}
              getMemberName={getMemberName}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 費用項目元件
interface ExpenseItemProps {
  expense: Expense
  isExpanded: boolean
  isDeleting: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  getMemberName: (userId: string) => string
}

function ExpenseItem({
  expense,
  isExpanded,
  isDeleting,
  onToggleExpand,
  onEdit,
  onDelete,
  getMemberName,
}: ExpenseItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
      {/* 主要資訊 */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* 類別圖示 */}
        <div className="w-10 h-10 rounded-xl bg-background-secondary flex items-center justify-center text-xl">
          {getCategoryIcon(expense.category)}
        </div>

        {/* 標題與付款人 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">
            {expense.title}
          </h4>
          <p className="text-sm text-foreground-muted">
            {expense.payer?.displayName || getMemberName(expense.paidBy)} 支付
          </p>
        </div>

        {/* 金額 */}
        <div className="text-right">
          <div className="font-medium text-foreground">
            {formatAmount(expense.amount, expense.currency)}
          </div>
          <div className="text-xs text-foreground-muted">
            {formatExpenseDate(expense.createdAt)}
          </div>
        </div>

        {/* 展開圖示 */}
        <div className="text-foreground-muted">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>

        {/* 更多選項 */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-foreground-secondary" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onEdit()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-background-secondary flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  編輯
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    onDelete()
                  }}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      刪除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      刪除
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 展開詳情 */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border bg-background-secondary/30">
          <h5 className="text-sm font-medium text-foreground-secondary mb-2">
            分攤明細
          </h5>
          <div className="space-y-2">
            {expense.splitAmong.map((split) => (
              <div
                key={split.userId}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  {split.user?.photoURL ? (
                    <img
                      src={split.user.photoURL}
                      alt=""
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] text-primary font-medium">
                        {(split.user?.displayName || getMemberName(split.userId))?.[0] || '?'}
                      </span>
                    </div>
                  )}
                  <span className="text-foreground">
                    {split.user?.displayName || getMemberName(split.userId)}
                  </span>
                </div>
                <span className="text-foreground-secondary">
                  {formatAmount(split.amount, expense.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 費用摘要卡片
interface ExpenseSummaryCardProps {
  totalAmount: number
  currency: string
  expenseCount: number
  byCategory: {
    category: ExpenseCategory
    amount: number
    percentage: number
  }[]
}

export function ExpenseSummaryCard({
  totalAmount,
  currency,
  expenseCount,
  byCategory,
}: ExpenseSummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white">
      <div className="mb-4">
        <p className="text-white/70 text-sm">總費用</p>
        <h2 className="text-3xl font-light">
          {formatAmount(totalAmount, currency)}
        </h2>
        <p className="text-white/70 text-sm mt-1">
          共 {expenseCount} 筆費用
        </p>
      </div>

      {byCategory.length > 0 && (
        <div className="space-y-2">
          {byCategory.slice(0, 3).map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(item.category)}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/90">{getCategoryName(item.category)}</span>
                  <span className="text-white/70">
                    {formatAmount(item.amount, currency)}
                  </span>
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-white/60 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}