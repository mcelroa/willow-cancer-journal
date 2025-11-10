import { useEffect, useRef } from 'react'
import type { Entry } from '../types'
import { todayISO } from '../types'
import { download } from '../utils'
import { useToast } from '../toast'
import { daysSinceBackup, markBackup } from '../backup'

export function BackupReminder({ entries, enabled = true }: { entries: Entry[]; enabled?: boolean }) {
  const toast = useToast()
  const lastShownDay = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const check = () => {
      if (!entries.length) return
      const days = daysSinceBackup()
      const today = todayISO()
      if (lastShownDay.current === today) return
      if (days === null || days >= 7) {
        lastShownDay.current = today
        toast({
          message: days === null ? 'No backups yet' : `Last backup ${days} day${days===1?'':'s'} ago`,
          kind: 'info',
          timeoutMs: 8000,
          actionLabel: 'Backup now',
          onAction: () => {
            const json = JSON.stringify(entries, null, 2)
            download(`willow-backup-${todayISO()}.json`, 'application/json', json)
            markBackup()
            toast('Backup saved', 'success')
          },
        })
      }
    }
    check()
    const id = window.setInterval(check, 1000 * 60 * 60 * 6) // every 6 hours
    return () => window.clearInterval(id)
  }, [entries, toast, enabled])

  return null
}
