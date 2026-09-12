'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { Section } from '@/_components/ui/Section'
import { Button } from '@/_components/ui/Button'
import Spinner from '@/_components/Spinner'
import { parseContentDispositionFileName } from '@/_lib/content-disposition'
import { labels } from '@/_lib/labels'

/** The proxy forwards the file's own name and type, and already answers private, no-store. */
const BACKUP_URL = '/api/backend/backup/excel'

export default function BackupSection() {
  const [preparing, setPreparing] = useState(false)
  const [failed, setFailed] = useState(false)

  // Fetched rather than linked so the owner sees that something is happening on a large garage,
  // and so a failure says so in French instead of replacing the page with an error body.
  async function download() {
    setPreparing(true)
    setFailed(false)
    try {
      const response = await fetch(BACKUP_URL)
      if (!response.ok) throw new Error(String(response.status))

      const blob = await response.blob()
      const name =
        parseContentDispositionFileName(response.headers.get('content-disposition')) ??
        'Sauvegarde_Garage.xlsx'

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', name)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      setFailed(true)
    } finally {
      setPreparing(false)
    }
  }

  return (
    <Section title={labels.backup.title} bodyClassName="px-4 py-4">
      <p className="max-w-prose text-sm text-muted">{labels.backup.description}</p>

      <div className="mt-4">
        <Button tone="primary" onClick={download} disabled={preparing}>
          {preparing ? (
            <>
              <Spinner />
              {labels.backup.preparing}
            </>
          ) : (
            <>
              <ArrowDownTrayIcon aria-hidden="true" className="-ml-0.5 size-4" />
              {labels.backup.download}
            </>
          )}
        </Button>
      </div>

      {failed && (
        <p role="alert" className="mt-3 text-sm text-danger-ink">
          {labels.backup.failed}
        </p>
      )}

      <p className="mt-4 max-w-prose text-xs text-muted">{labels.backup.warning}</p>
    </Section>
  )
}
