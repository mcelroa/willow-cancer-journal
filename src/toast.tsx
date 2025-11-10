import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type ToastKind = 'info' | 'success' | 'error'
type Toast = { id: string; kind: ToastKind; message: string; timeout: number; actionLabel?: string; onAction?: () => void }

export type ShowToast = (
  message: string | { message: string; kind?: ToastKind; timeoutMs?: number; actionLabel?: string; onAction?: () => void },
  kind?: ToastKind,
  timeoutMs?: number,
) => void

type ToastContextValue = {
  show: ShowToast
  toasts: Toast[]
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const ctr = useRef(0)
  const timers = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const t = timers.current.get(id)
    if (t) {
      window.clearTimeout(t)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback((message: string | { message: string; kind?: ToastKind; timeoutMs?: number; actionLabel?: string; onAction?: () => void }, kind: ToastKind = 'info', timeoutMs = 2600) => {
    const id = `t-${Date.now()}-${ctr.current++}`
    const payload = typeof message === 'string' ? { message, kind, timeoutMs } : message
    const toast: Toast = { id, kind: payload.kind ?? kind, message: payload.message, timeout: payload.timeoutMs ?? timeoutMs, actionLabel: payload.actionLabel, onAction: payload.onAction }
    setToasts(prev => [...prev, toast])
    const t = window.setTimeout(() => dismiss(id), toast.timeout)
    timers.current.set(id, t)
  }, [dismiss])

  const value = useMemo(() => ({ show, toasts, dismiss }), [show, toasts, dismiss])

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  )
}

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext)
  if (ctx) return ctx.show
  const fallback: ShowToast = (message, _kind, _timeoutMs) => {
    const text = typeof message === 'string' ? message : message?.message
    console.warn('ToastProvider missing:', text)
  }
  return fallback
}

export function ToastHost() {
  const ctx = useContext(ToastContext)
  if (!ctx) return null
  return (
    <div className="toasts" aria-live="polite" aria-atomic="true">
      {ctx.toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind}`} role="status">
          <span>{t.message}</span>
          {t.actionLabel && <button className="tab" onClick={() => { t.onAction?.(); ctx.dismiss(t.id) }}>{t.actionLabel}</button>}
          <button aria-label="Dismiss" className="tab" onClick={() => ctx.dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
