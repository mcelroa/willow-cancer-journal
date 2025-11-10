import { useEffect, useMemo, useState } from 'react'
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
  const [aboutOpen, setAboutOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    const loaded = loadEntries()
    setEntries(loaded)
    // Default to journal and new entry on start
    setTab('journal')
    setEditing(undefined)
    setNewEntryMode(true)
    try {
      const seen = localStorage.getItem('willow.firstRunShown')
      if (!seen) setShowWelcome(true)
    } catch {}
  }, [])

  // Normalize title (ensure clean ASCII hyphen)
  useEffect(() => {
    const t = tab[0].toUpperCase() + tab.slice(1)
    document.title = `Willow Cancer Journal - ${t}`
  }, [tab])

  // Clear one-shot saved banner token when leaving Journal
  useEffect(() => {
    if (tab !== 'journal' && savedAt !== null) {
      setSavedAt(null)
    }
  }, [tab, savedAt])

  const dismissWelcome = () => {
    setShowWelcome(false)
    try { localStorage.setItem('willow.firstRunShown', '1') } catch {}
  }

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
        <h1>Willow Cancer Journal</h1>
        <nav className="tabs">
          <TabBtn label="Journal" active={tab==='journal'} onClick={() => setTab('journal')} />
          <TabBtn label="History" active={tab==='history'} onClick={() => setTab('history')} />
          <TabBtn label="Trends" active={tab==='trends'} onClick={() => setTab('trends')} />
          <TabBtn label="Export" active={tab==='export'} onClick={() => setTab('export')} />
          <button className="tab" onClick={()=> setAboutOpen(true)}>About</button>
        </nav>
      </header>
      <main>
        <BackupReminder entries={entries} />
        {showWelcome && (
          <div className="banner info">
            <strong>Welcome to Willow.</strong> Your journal is private and stays on this device.
            <div className="actions" style={{marginTop:'.5rem'}}>
              <button className="btn-link" onClick={()=> setAboutOpen(true)}>Learn more</button>
              <button className="tab" onClick={dismissWelcome}>Dismiss</button>
            </div>
          </div>
        )}
        {tab === 'journal' && (
          <JournalForm
            key={editing ? `edit-${editing.id}` : newEntryMode ? 'new' : 'default'}
            initial={newEntryMode ? undefined : (editing ?? latestToday)}
            getByDate={(d) => entries.find(e => e.date === d)}
            savedAt={savedAt ?? undefined}
            onSave={(payload) => { handleSave(payload); setEditing(undefined); setNewEntryMode(true); setSavedAt(Date.now()) }}
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
      <footer className="app-footer">Willow is local‑first. Your data stays on this device. <button className="btn-link" onClick={()=> setAboutOpen(true)}>About</button></footer>

      {aboutOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="About Willow">
          <div className="modal">
            <div className="modal-body">
              <h2 style={{marginTop:0}}>About Willow</h2>
              <p>Willow Cancer Journal helps you track daily symptoms during treatment — mood, pain, fatigue, and nausea — and see trends over time.</p>
              <p><strong>Privacy first:</strong> your data is stored locally in your browser. You can export to JSON/CSV anytime and keep your own backups.</p>
              <p>Install Willow as an app for offline access and quick entry.</p>
            </div>
            <div className="modal-actions">
              <button className="tab" onClick={()=> setAboutOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
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
