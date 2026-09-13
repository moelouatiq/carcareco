import Spinner from '@/_components/Spinner'
import { labels } from '@/_lib/labels'

/**
 * Shown while a page under /home waits for its data.
 *
 * This is App Router's own Suspense boundary, so it replaces only the children of the home
 * layout: the sidebar and the mobile drawer stay where they are, and the reader keeps their
 * bearings instead of facing a blank screen. It appears exactly when there is something to wait
 * for -- an already prefetched navigation never shows it, and nothing here delays anything.
 *
 * The padding matches what every page under /home uses, so the spinner sits where the content
 * will, rather than jumping when the page arrives.
 */
export default function Loading() {
  return (
    <main className="lg:pl-60 pb-8">
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-6 sm:px-8">
        {/* One announcement: the container speaks, and the spinner beside it stays decorative. */}
        <p role="status" aria-live="polite" className="flex items-center gap-x-3 text-sm text-muted">
          <Spinner label="" />
          {labels.common.loading}
        </p>
      </div>
    </main>
  )
}
