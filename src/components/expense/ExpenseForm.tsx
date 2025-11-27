import { useExpenseSplit, type SplitMethod } from '@/hooks/useExpense'
import {
  EXPENSE_CATEGORIES,
  getCategoryIcon,
  getCategoryName,
  SUPPORTED_CURRENCIES,
} from '@/services/expenseService'
import type { Expense, ExpenseCategory, ExpenseSplit } from '@/types/expense'
import type { TripMember } from '@/types/trip'
import {
  Check,
  ChevronDown,
  DollarSign,
  Loader2,
  Tag,
  User,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface ExpenseFormProps {
  members: TripMember[]
  expense?: Expense | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    amount: number
    currency: string
    category: ExpenseCategory
    paidBy: string
    splitAmong: ExpenseSplit[]
  }) => Promise<void>
}

export default function ExpenseForm({
  members,
  expense,
  isOpen,
  onClose,
  onSubmit,
}: ExpenseFormProps) {
  const isEditing = !!expense

  // 表單狀態
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('TWD')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [paidBy, setPaidBy] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 分攤邏輯
  const numericAmount = parseFloat(amount) || 0
  const {
    method,
    setMethod,
    ratios,
    customAmounts,
    splits,
    amountDifference,
    updateRatio,
    updateCustomAmount,
    toggleMember,
    isValid,
  } = useExpenseSplit(numericAmount, members)

  // 初始化表單
  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setTitle(expense.title)
        setAmount(expense.amount.toString())
        setCurrency(expense.currency)
        setCategory(expense.category)
        setPaidBy(expense.paidBy)
      } else {
        setTitle('')
        setAmount('')
        setCurrency('TWD')
        setCategory('other')
        setPaidBy(members[0]?.userId || '')
      }
      setError(null)
    }
  }, [isOpen, expense, members])

  // 設定預設付款人
  useEffect(() => {
    if (!paidBy && members.length > 0) {
      setPaidBy(members[0].userId)
    }
  }, [members, paidBy])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('請輸入費用名稱')
      return
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('請輸入有效金額')
      return
    }
    if (!paidBy) {
      setError('請選擇付款人')
      return
    }
    if (splits.length === 0) {
      setError('請選擇至少一位分攤成員')
      return
    }
    if (!isValid) {
      setError('分攤金額總和與費用金額不符')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title: title.trim(),
        amount: numericAmount,
        currency,
        category,
        paidBy,
        splitAmong: splits,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || '儲存失敗')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const participatingUserIds = new Set(
    method === 'ratio'
      ? ratios.filter(r => r.ratio > 0).map(r => r.userId)
      : method === 'custom'
      ? customAmounts.filter(a => a.amount > 0).map(a => a.userId)
      : members.map(m => m.userId)
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-japanese-fade-in safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {isEditing ? '編輯費用' : '新增費用'}
          </h2>
          <button
            onClick={onClose}
            className="touch-target p-2 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-5">
            {/* 錯誤訊息 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 費用名稱 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                費用名稱
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：午餐、計程車費"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* 金額與幣別 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  金額
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  幣別
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 類別 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                類別
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                      category === cat
                        ? 'bg-primary text-white'
                        : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
                    }`}
                  >
                    <span>{getCategoryIcon(cat)}</span>
                    {getCategoryName(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* 付款人 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                付款人
              </label>
              <div className="relative">
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                >
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user?.displayName || '未知使用者'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-foreground-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 分攤方式 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                分攤方式
              </label>
              <div className="flex gap-2 mb-4">
                {([
                  { value: 'equal', label: '平均分攤' },
                  { value: 'ratio', label: '按比例' },
                  { value: 'custom', label: '自訂金額' },
                ] as { value: SplitMethod; label: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMethod(opt.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      method === opt.value
                        ? 'bg-primary text-white'
                        : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 分攤成員列表 */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((member) => {
                  const userId = member.userId
                  const isParticipating = participatingUserIds.has(userId)
                  const ratio = ratios.find(r => r.userId === userId)?.ratio || 0
                  const customAmount = customAmounts.find(a => a.userId === userId)?.amount || 0
                  const splitAmount = splits.find(s => s.userId === userId)?.amount || 0

                  return (
                    <div
                      key={userId}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isParticipating
                          ? 'bg-primary/5 border border-primary/20'
                          : 'bg-background-secondary border border-transparent'
                      }`}
                    >
                      {/* 勾選框 */}
                      <button
                        type="button"
                        onClick={() => toggleMember(userId)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isParticipating
                            ? 'bg-primary border-primary text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {isParticipating && <Check className="w-3 h-3" />}
                      </button>

                      {/* 使用者資訊 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
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
                          <span className="text-sm text-foreground truncate">
                            {member.user?.displayName || '未知使用者'}
                          </span>
                        </div>
                      </div>

                      {/* 比例/金額輸入 */}
                      {isParticipating && (
                        <div className="flex items-center gap-2">
                          {method === 'ratio' && (
                            <input
                              type="number"
                              value={ratio}
                              onChange={(e) => updateRatio(userId, parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                              className="w-16 px-2 py-1 text-sm bg-white border border-border rounded-lg text-center focus:outline-none focus:border-primary"
                            />
                          )}
                          {method === 'custom' && (
                            <input
                              type="number"
                              value={customAmount}
                              onChange={(e) => updateCustomAmount(userId, parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-24 px-2 py-1 text-sm bg-white border border-border rounded-lg text-right focus:outline-none focus:border-primary"
                            />
                          )}
                          {method === 'equal' && (
                            <span className="text-sm text-foreground-secondary">
                              {currency} {splitAmount.toFixed(0)}
                            </span>
                          )}
                          {method === 'ratio' && (
                            <span className="text-sm text-foreground-muted">
                              {currency} {splitAmount.toFixed(0)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 金額差異提示 */}
              {method === 'custom' && Math.abs(amountDifference) > 0.01 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  分攤金額與費用差額：{currency} {amountDifference.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-xl text-foreground-secondary hover:bg-background-secondary transition-colors"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                isEditing ? '更新' : '新增'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}