import { useState } from 'react'
import type { Entry } from '../types'
import { formatDate } from '../types.ts'
import { useConfirm } from '../confirm'

export function History({ entries, onDelete, onEdit }: {
  entries: Entry[]
  onDelete: (id: string) => void
  onEdit: (entry: Entry) => void
}) {
  const sorted = [...entries].sort((a,b) => b.date.localeCompare(a.date))
  const [q, setQ] = useState('')
  const filtered = sorted.filter(e => !q || (e.tags ?? []).some(t => t.toLowerCase().includes(q.toLowerCase())) || (e.notes ?? '').toLowerCase().includes(q.toLowerCase()))
  const confirm = useConfirm()
  const confirmDelete = async (e: Entry) => {
    const ok = await confirm({ message: `Delete entry for ${e.date}? This cannot be undone.`, confirmText: 'Delete', cancelText: 'Cancel', destructive: true })
    if (ok) onDelete(e.id)
  }

  return (
    <div className="card history">
      <div className="history-controls">
        <div className="input search">
          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M11 19a8 8 0 1 1 5.293-13.707A8 8 0 0 1 11 19Zm9.707 1.293-4.2-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <input className="input-field" placeholder="Filter by tag or note" value={q} onChange={(e)=>setQ(e.target.value)} />
          {q && <button className="clear" onClick={()=>setQ('')} aria-label="Clear filter">×</button>}
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Journal history</caption>
          <thead>
            <tr>
              <th scope="col">Date</th><th scope="col">Mood</th><th scope="col">Pain</th><th scope="col">Fatigue</th><th scope="col">Nausea</th><th scope="col">Tags</th><th scope="col">Notes</th><th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} onDoubleClick={() => onEdit(e)} style={{cursor:'pointer'}}>
                <td>{formatDate(e.date)}</td>
                <td>{e.mood}</td>
                <td>{e.pain}</td>
                <td>{e.fatigue}</td>
                <td>{e.nausea}</td>
                <td>{(e.tags ?? []).join(', ')}</td>
                <td className="notes-cell">{e.notes}</td>
                <td className="row-actions">
                  <button className="tab" onClick={() => onEdit(e)}>Edit</button>
                  <button className="danger" onClick={() => confirmDelete(e)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:'center', color:'var(--muted)'}}>No entries</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile-friendly list view (visible on small screens via CSS) */}
      <div className="mobile-list">
        {filtered.map(e => (
          <div key={e.id} className="entry-card">
            <div className="row-1">
              <strong>{formatDate(e.date)}</strong>
              <div className="card-actions">
                <button className="tab" onClick={() => onEdit(e)}>Edit</button>
                <button className="danger" onClick={() => confirmDelete(e)}>Delete</button>
              </div>
            </div>
            <div className="row-2">
              <span>Mood: {e.mood}</span>
              <span>Pain: {e.pain}</span>
              <span>Fatigue: {e.fatigue}</span>
              <span>Nausea: {e.nausea}</span>
            </div>
            {(e.tags?.length ?? 0) > 0 && (
              <div className="row-3 muted">Tags: {e.tags!.join(', ')}</div>
            )}
            {e.notes && (
              <div className="row-4 muted">Notes: {e.notes}</div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="muted" style={{textAlign:'center'}}>No entries</div>
        )}
      </div>
    </div>
  )
}
