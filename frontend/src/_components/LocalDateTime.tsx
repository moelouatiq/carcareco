'use client'

import moment from 'moment'
import 'moment/locale/fr'
import { useSyncExternalStore } from 'react'

const subscribeToHydration = () => () => undefined

export function useHasHydrated() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false)
}

export function useLocalDateTime(value?: Date | string, format = 'LLL') {
  const hasHydrated = useHasHydrated()

  if (!value) return ''

  const date = hasHydrated ? moment(value) : moment.utc(value)
  return date.locale('fr').format(format)
}

export default function LocalDateTime({ value }: { value: Date | string }) {
  const formatted = useLocalDateTime(value)

  return <time dateTime={moment.utc(value).toISOString()}>{formatted}</time>
}
