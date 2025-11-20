import { useEffect, useMemo, useState } from 'react'
import type { } from '../types'
import type { Question, QuestionStatus, QuestionType } from '../questions'
import { loadQuestions, saveQuestions, addQuestion, updateQuestion, deleteQuestion } from '../questions'
import { useToast } from '../toast'
import { useConfirm } from '../confirm'

const TYPES: { label: string, value: QuestionType }[] = [
  { label: 'Consultant', value: 'consultant' },
  { label: 'GP', value: 'gp' },
  { label: 'Hospital', value: 'hospital' },
  { label: 'Other', value: 'other' },
]

export function Questions() {
  const [items, setItems] = useState<Question[]>([])
  const [text, setText] = useState('')
  const [type, setType] = useState<QuestionType>('consultant')
  // Status filter removed per design; we only filter by type now
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all')
  const toast = useToast()
  const confirm = useConfirm()

  useEffect(() => { setItems(loadQuestions()) }, [])

  const active = useMemo(() => items.filter(i => i.status !== 'answered'), [items])
  const answered = useMemo(() => items.filter(i => i.status === 'answered'), [items])
  const filtered = useMemo(() => {
    return active.filter(i => (typeFilter==='all' || i.type===typeFilter))
  }, [active, typeFilter])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const next = addQuestion(items, { text, type })
    setItems(next)
    saveQuestions(next)
    setText('')
    toast('Question added', 'success')
  }

  const setStatus = (id: string, status: QuestionStatus) => {
    const next = updateQuestion(items, id, { status })
    setItems(next)
    saveQuestions(next)
  }

  const onDelete = async (id: string) => {
    const ok = await confirm({ message: 'Delete this question?', confirmText: 'Delete', cancelText: 'Cancel', destructive: true })
    if (!ok) return
    const next = deleteQuestion(items, id)
    setItems(next)
    saveQuestions(next)
    toast('Question deleted', 'info')
  }

  return (
    <div className="card questions">
      <form onSubmit={submit}>
        <div className="q-new">
          <input className="q-input" value={text} onChange={e=> setText(e.target.value)} placeholder="Type your question" aria-label="New question" />
          <span className="select-wrap q-type">
            <select className="nice-select" value={type} onChange={e=> setType(e.target.value as QuestionType)} aria-label="Question type">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </span>
          <button className="primary q-add" type="submit">Add</button>
        </div>
      </form>

      <div className="grid" style={{alignItems:'end', gap:'.5rem', marginTop:'.5rem'}}>
        <label className="field">
          <div className="field-label"><span>Type</span></div>
          <span className="select-wrap">
            <select className="nice-select" value={typeFilter} onChange={e=> setTypeFilter(e.target.value as any)}>
              <option value="all">All</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </span>
        </label>
        <div className="actions">
          <button className="tab" type="button" onClick={()=> { setTypeFilter('all') }}>Clear filters</button>
        </div>
      </div>

      <div className="table-wrap q-desktop-table" style={{marginTop:'.5rem'}}>
        <table className="table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Type</th>
              <th>Actions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(q => (
              <tr key={q.id}>
                <td style={{maxWidth:500}}>{q.text}</td>
                <td><span className="badge">{TYPES.find(t=>t.value===q.type)?.label}</span></td>
                <td style={{whiteSpace:'nowrap', display:'flex', gap:'.4rem'}}>
                  <button className="primary" onClick={()=> setStatus(q.id, 'answered')} type="button" title="Mark answered and archive">Answered</button>
                </td>
                <td className="row-actions"><button className="danger" onClick={()=> onDelete(q.id)} type="button">Delete</button></td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={4} style={{textAlign:'center'}} className="muted">No questions</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="q-mobile-list">
        {filtered.map(q => (
          <div key={q.id} className="q-card">
            <div className="q-card-top">
              <span className="badge">{TYPES.find(t=>t.value===q.type)?.label}</span>
              <div className="q-actions">
                <button className="primary" onClick={()=> setStatus(q.id, 'answered')} type="button">Answered</button>
                <button className="danger" onClick={()=> onDelete(q.id)} type="button">Delete</button>
              </div>
            </div>
            <div className="q-text">{q.text}</div>
          </div>
        ))}
        {filtered.length===0 && (
          <div className="muted" style={{textAlign:'center'}}>No questions</div>
        )}
      </div>

      <details style={{marginTop:'.75rem'}}>
        <summary>Answered ({answered.length})</summary>
        <div className="table-wrap" style={{marginTop:'.5rem'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {answered.map(q => (
                <tr key={q.id}>
                  <td style={{maxWidth:500}} className="muted">{q.text}</td>
                  <td><span className="badge">{TYPES.find(t=>t.value===q.type)?.label}</span></td>
                  <td className="row-actions"><button className="danger" onClick={()=> onDelete(q.id)} type="button">Delete</button></td>
                </tr>
              ))}
              {answered.length===0 && (
                <tr><td colSpan={3} style={{textAlign:'center'}} className="muted">No answered questions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
