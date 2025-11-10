import type { Entry } from './types'

export const STORAGE_KEY = 'cancerJournal.v1.entries'

export const loadEntries = (): Entry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as unknown[]).map(sanitize)
  } catch {
    return []
  }
}

export const saveEntries = (entries: Entry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const upsertEntry = (
  entries: Entry[],
  input: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Entry, 'id' | 'createdAt'>>,
): Entry[] => {
  const idx = entries.findIndex(e => e.date === input.date)
  const now = new Date().toISOString()
  if (idx >= 0) {
    const existing = entries[idx]
    const updated: Entry = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
    }
    const next = [...entries]
    next[idx] = updated
    return next
  }
  const id = input.id ?? `entry-${input.date}`
  const createdAt = input.createdAt ?? now
  return [ ...entries, { ...input, id, createdAt, updatedAt: now } ]
}

export const deleteEntry = (entries: Entry[], id: string) => entries.filter(e => e.id !== id)

export const toCSV = (entries: Entry[]): string => {
  const header = ['date','mood','pain','fatigue','nausea','notes','tags']
  const rows = [...entries]
    .sort((a,b) => a.date.localeCompare(b.date))
    .map(e => [
      e.date,
      String(e.mood),
      String(e.pain),
      String(e.fatigue),
      String(e.nausea),
      (e.notes ?? '').replaceAll('"', '""'),
      (e.tags ?? []).join('|').replaceAll('"','""'),
    ].map(v => /[",\n,]/.test(v) ? `"${v}"` : v).join(','))
  return [header.join(','), ...rows].join('\n')
}

export const sanitize = (x: unknown): Entry => {
  const now = new Date().toISOString()
  const obj: any = x as any
  const d = (typeof obj?.date === 'string' ? obj.date : '').slice(0,10)
  const date = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : now.slice(0,10)
  const mood = toNum(obj?.mood, 5)
  const pain = toNum(obj?.pain, 0)
  const fatigue = toNum(obj?.fatigue, 0)
  const nausea = toNum(obj?.nausea, 0)
  const notes = typeof obj?.notes === 'string' && obj.notes.trim() ? obj.notes : undefined
  const tags = Array.isArray(obj?.tags) ? obj.tags.filter(Boolean).map(String) : undefined
  const id = typeof obj?.id === 'string' && obj.id ? obj.id : `entry-${date}`
  const createdAt = typeof obj?.createdAt === 'string' && obj.createdAt ? obj.createdAt : now
  const updatedAt = typeof obj?.updatedAt === 'string' && obj.updatedAt ? obj.updatedAt : now
  return { id, date, mood, pain, fatigue, nausea, notes, tags, createdAt, updatedAt }
}

const toNum = (v: unknown, fallback: number): number => {
  const n = Number(v as any)
  return Number.isFinite(n) ? n : fallback
}

export const mergeImported = (
  existing: Entry[],
  imported: Entry[],
  overwrite: boolean,
): { next: Entry[]; conflicts: string[] } => {
  const byDate = new Map(existing.map(e => [e.date, e] as const))
  const conflicts: string[] = []
  for (const e of imported) {
    const safe = sanitize(e)
    if (byDate.has(safe.date)) {
      conflicts.push(safe.date)
      if (overwrite) byDate.set(safe.date, { ...byDate.get(safe.date)!, ...safe, id: `entry-${safe.date}`, updatedAt: new Date().toISOString() })
    } else {
      byDate.set(safe.date, safe)
    }
  }
  const next = Array.from(byDate.values())
  return { next, conflicts }
}
