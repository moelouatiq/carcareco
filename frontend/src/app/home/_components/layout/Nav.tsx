'use client'
import Image from "next/image"
import Link from "next/link"
import ProfileMenu from "./ProfileMenu"
import {
    Cog6ToothIcon,
    QueueListIcon,
    TruckIcon,
    UsersIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import clsx from "clsx";
import { usePathname } from 'next/navigation'
import { labels } from "@/_lib/labels";

const iconClass = "size-[18px] shrink-0"

// Grouped rather than a flat list: a workshop thinks in terms of what is on the ramps, who owns the
// car, and what is on the shelves.
const groups = [
    {
        label: labels.nav.groupWorkshop,
        items: [
            { name: labels.nav.work, href: '/home/work', icon: <QueueListIcon aria-hidden="true" className={iconClass} /> },
            { name: labels.nav.vehicles, href: '/home/vehicles', icon: <TruckIcon aria-hidden="true" className={iconClass} /> },
        ],
    },
    {
        label: labels.nav.groupClients,
        items: [
            { name: labels.nav.clients, href: '/home/clients', icon: <UsersIcon aria-hidden="true" className={iconClass} /> },
        ],
    },
    {
        label: labels.nav.groupManagement,
        items: [
            { name: labels.nav.inventory, href: '/home/inventory', icon: <WrenchScrewdriverIcon aria-hidden="true" className={iconClass} /> },
        ],
    },
]

function isCurrent(currentPath: string | null, href: string) {
    return href === '/home' ? currentPath === '/home' : !!currentPath?.startsWith(href)
}

function itemClasses(current: boolean) {
    return clsx(
        'group flex items-center gap-x-2.5 rounded-md px-2.5 py-1.5 text-sm',
        current
            ? 'bg-accent-soft font-medium text-ink'
            : 'text-muted hover:bg-neutral-soft hover:text-ink',
    )
}

export default function Nav({
    onSmallScreen,
    fullName,
    imageUrl,
}: {
    onSmallScreen: boolean,
    fullName: string,
    imageUrl: string
}) {
    const currentPath = usePathname();
    // This nav is rendered twice: once as the desktop sidebar and once inside the mobile dialog,
    // which is hidden and closed. Prefetching from the hidden copy asked the backend to render
    // every destination a second time on each page view, so only the visible sidebar prefetches.
    const prefetch = !onSmallScreen

    return (
        <>
            <div className="flex h-14 shrink-0 items-center gap-x-2.5 px-1">
                <Image alt="" width="40" height="40" className="size-7 w-auto" src="/logo.png" />
                <span className="truncate text-sm font-semibold text-ink">{labels.app.name}</span>
            </div>

            <nav className="flex flex-1 flex-col pb-3" aria-label={labels.nav.primary}>
                <div className="flex flex-1 flex-col gap-y-5">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">
                                {group.label}
                            </p>
                            <ul role="list" className="space-y-0.5">
                                {group.items.map((item) => {
                                    const current = isCurrent(currentPath, item.href)
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                prefetch={prefetch}
                                                href={item.href}
                                                aria-current={current ? 'page' : undefined}
                                                className={itemClasses(current)}
                                            >
                                                {item.icon}
                                                {item.name}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}

                    <div className="mt-auto border-t border-line pt-3">
                        <Link
                            prefetch={prefetch}
                            href="/home/settings"
                            aria-current={isCurrent(currentPath, '/home/settings') ? 'page' : undefined}
                            className={itemClasses(isCurrent(currentPath, '/home/settings'))}
                        >
                            <Cog6ToothIcon aria-hidden="true" className={iconClass} />
                            {labels.nav.settings}
                        </Link>
                        {!onSmallScreen && (
                            <div className="mt-1">
                                <ProfileMenu fullName={fullName} imageUrl={imageUrl} onSmallScreen={false} />
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    )
}
