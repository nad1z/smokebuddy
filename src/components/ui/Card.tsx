import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: Props) {
  const base = 'bg-zinc-800/80 rounded-2xl p-4 border border-zinc-700/60 shadow-lg'
  const interactive = onClick ? 'cursor-pointer active:bg-zinc-700/80 hover:border-zinc-600/80 hover:shadow-xl transition-all duration-150' : ''
  return (
    <div className={[base, interactive, className].filter(Boolean).join(' ')} onClick={onClick}>
      {children}
    </div>
  )
}
