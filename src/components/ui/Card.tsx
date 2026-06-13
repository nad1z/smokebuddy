import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: Props) {
  const base = 'bg-zinc-800 rounded-2xl p-4 border border-zinc-700'
  const interactive = onClick ? 'cursor-pointer active:bg-zinc-700 hover:bg-zinc-750 transition-colors' : ''
  return (
    <div className={[base, interactive, className].filter(Boolean).join(' ')} onClick={onClick}>
      {children}
    </div>
  )
}
