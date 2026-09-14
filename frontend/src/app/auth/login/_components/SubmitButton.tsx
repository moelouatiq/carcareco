import Spinner from '@/_components/Spinner'
import { labels } from '@/_lib/labels'

/**
 * The sign-in button, in both of its states.
 *
 * It takes the pending flag rather than reading it, which keeps it a pure function of its props:
 * the page owns the form state, and this can be rendered and asserted on its own.
 *
 * Disabling it while the action runs is what stops a second click from authenticating twice, and
 * the spinner carries no label of its own because the button's own text already says what is
 * happening.
 */
export default function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      aria-busy={isPending}
      className="flex w-full items-center justify-center gap-x-2 rounded-md bg-accent px-3 py-1.5 text-sm/6 font-semibold text-ink shadow-xs hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-default disabled:opacity-70 disabled:hover:bg-accent"
    >
      {isPending && <Spinner label="" />}
      {isPending ? labels.auth.signingIn : labels.auth.signIn}
    </button>
  )
}
