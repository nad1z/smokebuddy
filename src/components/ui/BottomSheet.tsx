import type { ReactNode } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: Props) {
  if (!isOpen) return null
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-3xl pb-safe-bottom">
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto text-zinc-400 hover:text-white p-2 -mr-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
