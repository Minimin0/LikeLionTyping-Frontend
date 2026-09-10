import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export const panelClass =
  'page-enter border border-zinc-200 bg-white p-5 shadow-sm sm:p-7 rounded-lg'
export const buttonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50'
export const secondaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 font-bold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'
export const inputClass =
  'min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100'

export function Busy({ label = '처리 중' }: { label?: string }) {
  return (
    <>
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      {label}
    </>
  )
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
    >
      {children}
    </p>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="border-y border-zinc-200 py-10 text-center text-zinc-500">
      {children}
    </div>
  )
}
