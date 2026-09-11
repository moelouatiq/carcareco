'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs } from '@/_components/ui/Tabs';
import { labels } from "@/_lib/labels";

// The account and the workshop settings are two views of the same area. A third one, users, is
// planned; adding it means adding an entry here and nothing else, because both the underlined
// desktop tabs and the mobile select are driven by this list.
const tabs = [
  { name: labels.nav.account, href: '/home/profile' },
  { name: labels.nav.invoiceOptions, href: '/home/settings' },
]

export default function SettingsTabs() {
  const currentPath = usePathname();
  const router = useRouter();
  const items = tabs.map((tab) => ({
    label: tab.name,
    href: tab.href,
    current: currentPath.startsWith(tab.href),
  }))

  return (
    <>
      {/* Below the tab breakpoint the same destinations are a select, which stays reachable with a
          keyboard and does not scroll off the side of a phone. */}
      <div className="sm:hidden">
        <label htmlFor="settings-section" className="block text-[13px] font-medium text-ink">
          {labels.nav.selectTab}
        </label>
        <select
          id="settings-section"
          defaultValue={items.find((tab) => tab.current)?.href}
          className="mt-1 block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          onChange={(e) => router.push(e.currentTarget.value)}
        >
          {items.map((tab) => (
            <option key={tab.href} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block">
        <Tabs items={items} ariaLabel={labels.nav.selectTab} />
      </div>
    </>
  )
}
