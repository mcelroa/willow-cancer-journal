import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import type { Entry, Tab } from './types'
import { todayISO } from './types'
import { loadEntries, saveEntries, upsertEntry, deleteEntry } from './storage'
import { JournalForm } from './components/JournalForm'
import { History } from './components/History'
import { Trends } from './components/Trends'
import { Export } from './components/Export'
import { useToast } from './toast'
import { BackupReminder } from './components/BackupReminder'

function App() {
  const [tab, setTab] = useState<Tab>('journal')
  const [entries, setEntries] = useState<Entry[]>([])
  const [editing, setEditing] = useState<Entry | undefined>(undefined)
  const [newEntryMode, setNewEntryMode] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const loaded = loadEntries()
    setEntries(loaded)
    // Default to journal and new entry on start
    setTab('journal')
    setEditing(undefined)
    setNewEntryMode(true)
  }, [])

  // Normalize title (ensure clean ASCII hyphen)
  useEffect(() => {
    const t = tab[0].toUpperCase() + tab.slice(1)
    document.title = `Cancer Journal - ${t}`
  }, [tab])

  const latestToday = useMemo(() => entries.find(e => e.date === todayISO()), [entries])

  const handleSave = (partial: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const next = upsertEntry(entries, partial)
    setEntries(next)
    saveEntries(next)
    toast('Entry saved', 'success')
  }

  const handleDelete = (id: string) => {
    const next = deleteEntry(entries, id)
    setEntries(next)
    saveEntries(next)
    toast('Entry deleted', 'info')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cancer Journal</h1>
        <nav className="tabs">
          <TabBtn label="Journal" active={tab==='journal'} onClick={() => setTab('journal')} />
          <TabBtn label="History" active={tab==='history'} onClick={() => setTab('history')} />
          <TabBtn label="Trends" active={tab==='trends'} onClick={() => setTab('trends')} />
          <TabBtn label="Export" active={tab==='export'} onClick={() => setTab('export')} />
        </nav>
      </header>
      <main>
        <BackupReminder entries={entries} />
        {tab === 'journal' && (
          <JournalForm
            key={editing ? `edit-${editing.id}` : newEntryMode ? 'new' : 'default'}
            initial={newEntryMode ? undefined : (editing ?? latestToday)}
            onSave={(payload) => { handleSave(payload); setEditing(undefined); setNewEntryMode(false) }}
            onClearEdit={() => { setEditing(undefined); setNewEntryMode(true) }}
          />
        )}

        {tab === 'history' && (
          <History
            entries={entries}
            onDelete={(id) => handleDelete(id)}
            onEdit={(entry) => { setEditing(entry); setNewEntryMode(false); setTab('journal') }}
          />
        )}

        {tab === 'trends' && (
          <Trends entries={entries} />
        )}

        {tab === 'export' && (
          <Export entries={entries} onImport={(next) => { setEntries(next); saveEntries(next); toast('Import complete', 'success') }} />
        )}
      </main>
      <footer className="app-footer">Local-first. Your data stays on this device.</footer>
    </div>
  )
}

function TabBtn({ label, active, onClick }: {label: string; active: boolean; onClick: () => void}) {
  return (
    <button className={"tab" + (active ? ' active' : '')} onClick={onClick}>
      {label}
    </button>
  )
}

export default App
