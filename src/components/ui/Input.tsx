import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...rest }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={inputId}
        className={[
          'bg-zinc-700 border rounded-xl px-4 py-3 text-white placeholder-zinc-500',
          'text-base min-h-[48px]',
          'focus:outline-none focus:ring-2 focus:ring-orange-500',
          error ? 'border-red-500' : 'border-zinc-600',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
