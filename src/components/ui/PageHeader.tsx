import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  left?: ReactNode
  right?: ReactNode
}

export function PageHeader({ title, subtitle, left, right }: Props) {
  return (
    <header className="flex items-center gap-3 px-4 pt-safe-top pb-3 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
      {left && <div className="flex-shrink-0">{left}</div>}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-400 truncate">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  )
}
