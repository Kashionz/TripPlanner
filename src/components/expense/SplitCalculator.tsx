import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Copy,
  Calculator,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import type { ExpenseSummary, Settlement } from '@/types/expense'
import { formatAmount } from '@/services/expenseService'

interface SplitCalculatorProps {
  summary: ExpenseSummary
  settlements: Settlement[]
}

export default function SplitCalculator({
  summary,
  settlements,
}: SplitCalculatorProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopySettlement = async (settlement: Settlement, index: number) => {
    const text = `${settlement.from.displayName} 需付給 ${settlement.to.displayName}：${formatAmount(settlement.amount, settlement.currency)}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('複製失敗:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 成員餘額 */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          成員餘額
        </h3>

        <div className="space-y-3">
          {summary.byPayer.map((payer) => (
            <BalanceItem
              key={payer.userId}
              displayName={payer.displayName}
              totalPaid={payer.totalPaid}
              totalOwed={payer.totalOwed}
              balance={payer.balance}
              currency={summary.currency}
            />
          ))}
        </div>

        {/* 說明 */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              應收款
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              應付款
            </span>
            <span className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-foreground-muted" />
              已結清
            </span>
          </div>
        </div>
      </div>

      {/* 結算建議 */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          結算建議
        </h3>

        {settlements.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground-secondary">
              所有費用已結清！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement, index) => (
              <SettlementItem
                key={`${settlement.from.userId}-${settlement.to.userId}`}
                settlement={settlement}
                isCopied={copiedIndex === index}
                onCopy={() => handleCopySettlement(settlement, index)}
              />
            ))}
          </div>
        )}

        {/* 總結 */}
        {settlements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-foreground-muted">
              僅需 {settlements.length} 筆轉帳即可完成結算
            </p>
          </div>
        )}
      </div>

      {/* 結算提示 */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <h4 className="font-medium text-primary mb-2">結算提示</h4>
        <ul className="text-sm text-foreground-secondary space-y-1">
          <li>• 系統會自動計算最少轉帳次數</li>
          <li>• 點擊複製按鈕可快速分享結算資訊</li>
          <li>• 實際轉帳後請互相確認</li>
        </ul>
      </div>
    </div>
  )
}

// 餘額項目元件
interface BalanceItemProps {
  displayName: string
  totalPaid: number
  totalOwed: number
  balance: number
  currency: string
}

function BalanceItem({
  displayName,
  totalPaid,
  totalOwed,
  balance,
  currency,
}: BalanceItemProps) {
  const isPositive = balance > 0
  const isNegative = balance < 0
  const isZero = Math.abs(balance) < 0.01

  return (
    <div className="flex items-center gap-4 p-3 bg-background-secondary/50 rounded-xl">
      {/* 使用者名稱 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          {displayName}
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground-muted">
          <span>支付 {formatAmount(totalPaid, currency)}</span>
          <span>應付 {formatAmount(totalOwed, currency)}</span>
        </div>
      </div>

      {/* 餘額 */}
      <div
        className={`text-right ${
          isPositive
            ? 'text-green-600'
            : isNegative
            ? 'text-red-500'
            : 'text-foreground-muted'
        }`}
      >
        <div className="flex items-center gap-1 font-medium">
          {isPositive && <TrendingUp className="w-4 h-4" />}
          {isNegative && <TrendingDown className="w-4 h-4" />}
          {isZero && <Minus className="w-4 h-4" />}
          {isZero ? '已結清' : formatAmount(Math.abs(balance), currency)}
        </div>
        {!isZero && (
          <div className="text-xs">
            {isPositive ? '應收款' : '應付款'}
          </div>
        )}
      </div>
    </div>
  )
}

// 結算項目元件
interface SettlementItemProps {
  settlement: Settlement
  isCopied: boolean
  onCopy: () => void
}

function SettlementItem({
  settlement,
  isCopied,
  onCopy,
}: SettlementItemProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-background-secondary/50 rounded-xl">
      {/* 付款人 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          {settlement.from.displayName}
        </div>
        <div className="text-xs text-foreground-muted">付款</div>
      </div>

      {/* 箭頭與金額 */}
      <div className="flex items-center gap-2 px-3">
        <div className="text-center">
          <div className="font-medium text-primary">
            {formatAmount(settlement.amount, settlement.currency)}
          </div>
          <ArrowRight className="w-5 h-5 text-foreground-muted mx-auto" />
        </div>
      </div>

      {/* 收款人 */}
      <div className="flex-1 min-w-0 text-right">
        <div className="font-medium text-foreground truncate">
          {settlement.to.displayName}
        </div>
        <div className="text-xs text-foreground-muted">收款</div>
      </div>

      {/* 複製按鈕 */}
      <button
        onClick={onCopy}
        className={`p-2 rounded-lg transition-colors ${
          isCopied
            ? 'bg-green-100 text-green-600'
            : 'hover:bg-background-tertiary text-foreground-secondary'
        }`}
        title="複製結算資訊"
      >
        {isCopied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

// 簡化版結算卡片 (用於費用頁面側邊欄)
interface SettlementSummaryCardProps {
  settlements: Settlement[]
  currency: string
  onViewDetails: () => void
}

export function SettlementSummaryCard({
  settlements,
  currency,
  onViewDetails,
}: SettlementSummaryCardProps) {
  const totalSettlementAmount = settlements.reduce(
    (sum, s) => sum + s.amount,
    0
  )

  if (settlements.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-green-700 font-medium">所有費用已結清！</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">待結算</h4>
        <button
          onClick={onViewDetails}
          className="text-sm text-primary hover:underline"
        >
          查看詳情
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {settlements.slice(0, 2).map((settlement) => (
          <div
            key={`${settlement.from.userId}-${settlement.to.userId}`}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-foreground truncate flex-1">
              {settlement.from.displayName}
            </span>
            <ArrowRight className="w-4 h-4 text-foreground-muted flex-shrink-0" />
            <span className="text-foreground truncate flex-1 text-right">
              {settlement.to.displayName}
            </span>
          </div>
        ))}
        {settlements.length > 2 && (
          <p className="text-xs text-foreground-muted text-center">
            還有 {settlements.length - 2} 筆...
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">總結算金額</span>
          <span className="font-medium text-foreground">
            {formatAmount(totalSettlementAmount, currency)}
          </span>
        </div>
      </div>
    </div>
  )
}