export type Entry = {
  id: string
  date: string
  mood: number
  pain: number
  fatigue: number
  nausea: number
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export type Tab = 'journal' | 'history' | 'trends' | 'export' | 'questions'

export const todayISO = (): string => new Date().toISOString().slice(0, 10)
export const toISO = (d: Date): string => d.toISOString().slice(0, 10)
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
export const normalize = (n: number, min: number, max: number) => (clamp(n, min, max) - min) / (max - min)

// Format YYYY-MM-DD to DD/MM/YYYY for display
export const formatDate = (iso: string): string => {
  if (!iso) return iso
  const s = iso.slice(0, 10)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return iso
  const [, y, mo, d] = m
  return `${d}/${mo}/${y}`
}
