import type { Entry } from '../types'
import { todayISO } from '../types'
import { toCSV, mergeImported, sanitize } from '../storage'
import { download } from '../utils'
import { useToast } from '../toast'
import { useConfirm } from '../confirm'
import { getLastBackup, markBackup } from '../backup'

export function Export({ entries, onImport }: { entries: Entry[]; onImport: (next: Entry[]) => void }) {
  const json = JSON.stringify(entries, null, 2)
  const toast = useToast()
  const confirm = useConfirm()
  const lastBackup = getLastBackup()

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
      <small className="muted">Last backup: {lastBackup ? lastBackup.slice(0,10) : 'never'}</small>
      <details>
        <summary>Preview JSON</summary>
        <pre className="preview">{json}</pre>
      </details>
      {/* App Icons section removed */}
    </div>
  )
}
