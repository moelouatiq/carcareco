'use client'
import Image from "next/image"
import Link from "next/link"
import ProfileMenu from "./ProfileMenu"
import { 
    Cog6ToothIcon, 
    QueueListIcon,
    TruckIcon,
    UsersIcon, 
  } from '@heroicons/react/24/outline'
import clsx from "clsx"; 
import { usePathname } from 'next/navigation'
import { labels } from "@/_lib/labels";
 const navigationIconClass = "size-6 shrink-0";
const navigation = [
    // { name: 'Dashboard', href: '/home', icon: <HomeIcon aria-hidden="true" className={navigationIconClass}></HomeIcon>},
    { name: labels.nav.work, href: '/home/work', icon: <QueueListIcon aria-hidden="true" className={navigationIconClass}></QueueListIcon> },
    { name: labels.nav.clients, href: '/home/clients', icon: <UsersIcon aria-hidden="true" className={navigationIconClass}></UsersIcon>  },
    { name: labels.nav.vehicles, href: '/home/vehicles', icon: <TruckIcon aria-hidden="true" className={navigationIconClass}></TruckIcon>  },
    { name: labels.nav.inventory, href: '/home/inventory', icon: <Cog6ToothIcon aria-hidden="true" className={navigationIconClass}></Cog6ToothIcon>  },
    // { name: 'Services', href: '/home/services', icon: <WrenchScrewdriverIcon aria-hidden="true" className={navigationIconClass}></WrenchScrewdriverIcon>  },
]
 

export default   function Nav({
    onSmallScreen, 
    fullName,
    imageUrl,
}:{
    onSmallScreen:boolean, 
    fullName:string,
    imageUrl:string
}) {
    const currentPath = usePathname() ; 
    return (
        <>
            <div className="flex h-16 shrink-0 items-center">
                <Image alt="B-dec" width="50" height="50" className="h-8 w-auto" src="/logo.png" ></Image>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {/* This nav is rendered twice: once as the desktop sidebar and once inside
                                the mobile dialog, which is hidden and closed. Prefetching from the
                                hidden copy asked the backend to render every destination a second
                                time on each page view, so only the visible sidebar prefetches. */}
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        prefetch={!onSmallScreen}
                                        href={item.href}
                                        className={clsx(
                                               (item.href !=='/home'  &&currentPath?.startsWith(item.href) || item.href =='/home'&& currentPath === '/home') //home is ambigous
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                        )}
                                    >
                                        {item.icon}
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                    {!onSmallScreen && <li className="mt-auto flex flex-col mb-5   ">
                        <Link
                            prefetch={!onSmallScreen}
                            href="/home/settings"
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <Cog6ToothIcon aria-hidden="true" className="size-6 shrink-0" />
                            {labels.nav.settings}
                        </Link>
                        <ProfileMenu  fullName={fullName} imageUrl={imageUrl} onSmallScreen={false}></ProfileMenu>
                    </li>}
                </ul>
            </nav>

        </>
    )
}