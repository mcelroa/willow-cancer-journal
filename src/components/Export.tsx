import type { Entry } from '../types'
import { todayISO, formatDate } from '../types'
import { toCSV, mergeImported, sanitize } from '../storage'
import { download } from '../utils'
import { useToast } from '../toast'
import { useConfirm } from '../confirm'
import { getLastBackup, markBackup } from '../backup'
import React from 'react'
import { VisitSummary } from './VisitSummary'

export function Export({ entries, onImport }: { entries: Entry[]; onImport: (next: Entry[]) => void }) {
  const json = JSON.stringify(entries, null, 2)
  const toast = useToast()
  const confirm = useConfirm()
  const lastBackup = getLastBackup()
  const [summaryRange, setSummaryRange] = React.useState<'30'|'90'|'all'>('30')
  const [includeNotes, setIncludeNotes] = React.useState(false)
  const pageSize = 10
  const [page, setPage] = React.useState(1)

  const filteredCount = React.useMemo(() => selectRangeCount(entries, summaryRange), [entries, summaryRange])
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize))

  React.useEffect(() => { setPage(1) }, [summaryRange, entries])

  // App icon PNG export removed

  const handleImport = async (file: File) => {
    const text = await file.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { toast('Invalid JSON', 'error'); return }
    const arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.entries) ? (data as any).entries : null)
    if (!Array.isArray(arr)) { toast('Expected array or { entries: [...] }', 'error'); return }
    const imported = arr.map(sanitize)
    const { next, conflicts } = mergeImported(entries, imported, false)
    if (conflicts.length > 0) {
      const ok = await confirm({ message: `${conflicts.length} existing date${conflicts.length===1?'':'s'} found. Overwrite them?`, confirmText: 'Overwrite', cancelText: 'Keep existing' })
      const final = mergeImported(entries, imported, ok).next
      onImport(final)
      toast(`Imported ${imported.length} entr${imported.length===1?'y':'ies'}${ok ? ' (overwrote conflicts)' : ''}.`, 'success')
    } else {
      onImport(next)
      toast(`Imported ${imported.length} entr${imported.length===1?'y':'ies'}.`, 'success')
    }
  }

  return (
    <div className="card export">
      <div className="actions">
        <button className="primary" onClick={() => { download(`willow-journal-${todayISO()}.json`, 'application/json', json); markBackup(); toast('Backup saved', 'success') }}>Download JSON</button>
        <button onClick={() => download(`willow-journal-${todayISO()}.csv`, 'text/csv', toCSV(entries))}>Download CSV</button>
        <label className="tab" style={{display:'inline-flex', alignItems:'center', gap:'.5rem', cursor:'pointer'}}>
          Import JSON
          <input type="file" accept="application/json" style={{display:'none'}} onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleImport(f)
            e.currentTarget.value = ''
          }} />
        </label>
      </div>
      <small className="muted">Last backup: {lastBackup ? formatDate(lastBackup.slice(0,10)) : 'never'}</small>
      <details>
        <summary>Preview JSON</summary>
        <pre className="preview">{json}</pre>
      </details>
      <div className="vs-controls">
        <h3>Visit Summary (Print/PDF)</h3>
        <div className="actions" style={{justifyContent:'flex-start', flexWrap:'wrap', gap:'.5rem'}}>
          <span className="muted">Range:</span>
          <button className={'tab' + (summaryRange==='30'?' active':'')} onClick={()=>setSummaryRange('30')}>30</button>
          <button className={'tab' + (summaryRange==='90'?' active':'')} onClick={()=>setSummaryRange('90')}>90</button>
          <button className={'tab' + (summaryRange==='all'?' active':'')} onClick={()=>setSummaryRange('all')}>All</button>
          <label className="field" style={{flexDirection:'row', alignItems:'center', gap:'.4rem'}}>
            <input type="checkbox" checked={includeNotes} onChange={e=> setIncludeNotes(e.target.checked)} />
            <span>Include notes</span>
          </label>
          <button className="primary" onClick={()=> window.print()}>Print / Save as PDF</button>
        </div>
      </div>
      <div className="print-area">
        <div className="screen-summary">
          <VisitSummary entries={entries} range={summaryRange} includeNotes={includeNotes} page={page} pageSize={pageSize} />
        </div>
        <div className="vs-pager">
          <button className="tab" onClick={()=> setPage(p => Math.max(1, p-1))} disabled={page<=1}>Prev</button>
          <span className="muted">{page} / {totalPages}</span>
          <button className="tab" onClick={()=> setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages}>Next</button>
        </div>
        {/* Print version renders all rows without pagination */}
        <div style={{display:'none'}} className="print-full">
          <VisitSummary entries={entries} range={summaryRange} includeNotes={includeNotes} forPrint={true} />
        </div>
      </div>
      {/* App Icons section removed */}
    </div>
  )
}

function selectRangeCount(entries: Entry[], range: '30'|'90'|'all') {
  if (range === 'all') return entries.length
  const n = range === '30' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - n + 1)
  const cut = cutoff.toISOString().slice(0,10)
  return entries.filter(e => e.date >= cut).length
}
