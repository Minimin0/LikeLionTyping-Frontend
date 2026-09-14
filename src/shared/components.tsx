import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export const panelClass =
  // 공통 UI의 색·테두리만 라디오 디자인으로 맞춘다. 동작/상태 처리는 변경하지 않는다.
  'radio-panel page-enter p-5 sm:p-7'
export const buttonClass =
  'radio-button radio-button-primary inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50'
export const secondaryButtonClass =
  'radio-button radio-button-secondary inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50'
export const inputClass =
  'radio-input min-h-11 w-full px-3 py-2 outline-none'

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
