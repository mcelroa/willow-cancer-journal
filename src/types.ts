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

export type Tab = 'journal' | 'history' | 'trends' | 'export'

export const todayISO = (): string => new Date().toISOString().slice(0, 10)
export const toISO = (d: Date): string => d.toISOString().slice(0, 10)
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
export const normalize = (n: number, min: number, max: number) => (clamp(n, min, max) - min) / (max - min)
