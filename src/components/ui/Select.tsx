import type { SelectHTMLAttributes } from 'react'

interface Option {
  value: string
  label: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Option[]
  error?: string
}

export function Select({ label, options, error, id, className = '', ...rest }: Props) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <select
        id={selectId}
        className={[
          'bg-zinc-700 border rounded-xl px-4 py-3 text-white',
          'text-base min-h-[48px] appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-orange-500',
          error ? 'border-red-500' : 'border-zinc-600',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
