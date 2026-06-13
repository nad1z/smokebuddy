import type { ReactNode } from 'react'

type Color = 'orange' | 'green' | 'red' | 'zinc' | 'blue' | 'yellow'

interface Props {
  children: ReactNode
  color?: Color
}

const colorClasses: Record<Color, string> = {
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  zinc: 'bg-zinc-700 text-zinc-300 border-zinc-600',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

export function Badge({ children, color = 'zinc' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses[color]}`}
    >
      {children}
    </span>
  )
}
