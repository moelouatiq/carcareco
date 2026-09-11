
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import clsx from "clsx"
import Image from 'next/image'
import Link from 'next/link'
import { labels } from "@/_lib/labels";

// Signing out is handled entirely by the middleware, which clears the session cookies and
// redirects; there is no page behind /home/logout. That needs a real document navigation, so it
// stays an anchor while the profile link becomes a client-side transition.
const userNavigation = [
    { name: labels.nav.profile, href: '/home/profile', clientSide: true },
    { name: labels.nav.signOut, href: '/home/logout', clientSide: false },
]

const menuItemClass =
    "block px-3 py-1.5 text-sm text-ink data-focus:bg-neutral-soft data-focus:outline-hidden"

export default function ProfileMenu({
    onSmallScreen,
    fullName,
    imageUrl,
}: {
    onSmallScreen: boolean,
    fullName: string,
    imageUrl: string
}) {
    return (
        <Menu as="div" className="relative">
            <MenuButton
                className={clsx(
                    'flex w-full items-center gap-x-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-neutral-soft',
                    onSmallScreen && '-m-1.5 w-auto',
                )}
            >
                <span className="sr-only">{labels.nav.openUserMenu}</span>
                <Image
                    alt=""
                    src={imageUrl}
                    width="64"
                    height="64"
                    unoptimized
                    className="size-7 shrink-0 rounded-full bg-neutral-soft object-cover"
                />
                {!onSmallScreen && (
                    <>
                        <span aria-hidden="true" className="min-w-0 flex-1 truncate text-sm text-ink">
                            {fullName}
                        </span>
                        <EllipsisVerticalIcon aria-hidden="true" className="size-4 shrink-0 text-muted" />
                    </>
                )}
            </MenuButton>
            <MenuItems
                modal={false}
                transition
                className={clsx(
                    !onSmallScreen && "bottom-full",
                    "absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md border border-line bg-surface py-1.5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in",
                )}
            >
                {userNavigation.map((item) => (
                    <MenuItem key={item.name}>
                        {item.clientSide
                            ? <Link href={item.href} className={menuItemClass}>{item.name}</Link>
                            : <a href={item.href} className={menuItemClass}>{item.name}</a>}
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    )
}
