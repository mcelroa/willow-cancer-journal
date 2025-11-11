import type { Entry } from '../types'
import { todayISO } from '../types'

type RangeOpt = '30' | '90' | 'all'

export function VisitSummary({ entries, range, includeNotes, page = 1, pageSize = 10, forPrint = false }: { entries: Entry[]; range: RangeOpt; includeNotes: boolean; page?: number; pageSize?: number; forPrint?: boolean }) {
  const filtered = selectRange(entries, range)
  const sorted = [...filtered].sort((a,b) => a.date.localeCompare(b.date))
  const stats = computeStats(sorted)
  const today = todayISO()
  const period = periodLabel(sorted)
  const rows = forPrint ? sorted : paginate(sorted, page, pageSize)

  return (
    <section className="visit-summary" id="print-summary" aria-label="Visit summary">
      <header className="vs-header">
        <h2>Willow Visit Summary</h2>
        <div className="muted">Generated on {today}{period ? ` • Period: ${period}` : ''}</div>
      </header>

      <div className="vs-grid">
        <Card title="Entries">
          <div className="vs-kpi">{sorted.length}</div>
        </Card>
        <Card title="Avg Mood"><div className="vs-kpi">{fmt(stats.avg.mood)}</div></Card>
        <Card title="Avg Pain"><div className="vs-kpi">{fmt(stats.avg.pain)}</div></Card>
        <Card title="Avg Fatigue"><div className="vs-kpi">{fmt(stats.avg.fatigue)}</div></Card>
        <Card title="Avg Nausea"><div className="vs-kpi">{fmt(stats.avg.nausea)}</div></Card>
      </div>

      <div className="vs-section">
        <h3>Highlights</h3>
        <ul className="vs-list">
          <li>Best mood: {stats.best?.date ?? '—'} {stats.best ? `(mood ${stats.best.mood})` : ''}</li>
          <li>Most challenging day: {stats.worst?.date ?? '—'} {stats.worst ? `(mood ${stats.worst.mood})` : ''}</li>
          {stats.topTags.length > 0 && (
            <li>Common tags: {stats.topTags.slice(0,5).join(', ')}</li>
          )}
        </ul>
      </div>

      <div className="vs-section">
        <h3>Entries</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mood</th>
                <th>Pain</th>
                <th>Fatigue</th>
                <th>Nausea</th>
                <th>Tags</th>
                {includeNotes && <th>Notes</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.mood}</td>
                  <td>{e.pain}</td>
                  <td>{e.fatigue}</td>
                  <td>{e.nausea}</td>
                  <td>{(e.tags ?? []).join(', ')}</td>
                  {includeNotes && <td className="notes-cell">{e.notes}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="muted vs-footer">Willow Cancer Journal • Local‑first and private</footer>
    </section>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="vs-card">
      <div className="vs-card-title muted">{title}</div>
      {children}
    </div>
  )
}

function computeStats(entries: Entry[]) {
  const n = entries.length || 1
  const sum = entries.reduce((acc, e) => ({
    mood: acc.mood + e.mood,
    pain: acc.pain + e.pain,
    fatigue: acc.fatigue + e.fatigue,
    nausea: acc.nausea + e.nausea,
  }), { mood: 0, pain: 0, fatigue: 0, nausea: 0 })
  const best = [...entries].sort((a,b)=> b.mood - a.mood)[0]
  const worst = [...entries].sort((a,b)=> a.mood - b.mood)[0]
  const tagCounts = new Map<string, number>()
  for (const e of entries) {
    for (const t of e.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  }
  const topTags = [...tagCounts.entries()].sort((a,b)=> b[1]-a[1]).map(([t])=>t)
  return {
    avg: { mood: sum.mood/n, pain: sum.pain/n, fatigue: sum.fatigue/n, nausea: sum.nausea/n },
    best, worst, topTags,
  }
}

function selectRange(entries: Entry[], range: RangeOpt) {
  if (range === 'all') return entries
  const n = range === '30' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - n + 1)
  const cut = cutoff.toISOString().slice(0,10)
  return entries.filter(e => e.date >= cut)
}

function fmt(n: number) { return (Math.round(n * 10) / 10).toFixed(1) }

function periodLabel(entries: Entry[]): string | null {
  if (entries.length === 0) return null
  const first = entries[0].date
  const last = entries[entries.length-1].date
  return `${first} – ${last}`
}

function paginate<T>(arr: T[], page: number, pageSize: number): T[] {
  const p = Math.max(1, page)
  const start = (p - 1) * pageSize
  return arr.slice(start, start + pageSize)
}
