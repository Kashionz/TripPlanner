import React from 'react'

interface SettingItemProps {
  icon?: React.ReactNode
  title: string
  description?: string
  children?: React.ReactNode
  onClick?: () => void
  danger?: boolean
}

export default function SettingItem({
  icon,
  title,
  description,
  children,
  onClick,
  danger = false,
}: SettingItemProps) {
  return (
    <div
      className={`
        flex items-center justify-between py-4 px-2
        ${onClick ? 'cursor-pointer hover:bg-background-secondary rounded-lg transition-colors' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3 flex-1">
        {icon && (
          <div className={`mt-0.5 ${danger ? 'text-red-500' : 'text-text-secondary'}`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className={`text-base font-light ${danger ? 'text-red-500' : 'text-foreground'}`}>
            {title}
          </h3>
          {description && (
            <p className="text-sm text-text-secondary mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="ml-4">
          {children}
        </div>
      )}
    </div>
  )
}