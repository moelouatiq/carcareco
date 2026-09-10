
import {  Menu, MenuButton, MenuItem, MenuItems  } from '@headlessui/react'
import {  
  EllipsisVerticalIcon, 
} from '@heroicons/react/24/outline'
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
    "block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"

 
export default function ProfileMenu({
    onSmallScreen, 
    fullName,
    imageUrl,
}:{
    onSmallScreen:boolean, 
    fullName:string,
    imageUrl:string
})

{     
   
    return (
        <> 
          <Menu as="div" className="relative">
                               <MenuButton className={clsx(onSmallScreen&&"-m-1.5","flex items-center p-1.5")}>
                                   <span className="sr-only">{labels.nav.openUserMenu}</span>

                                    <Image alt={fullName}   
                                       src={imageUrl}
                                       width="100"
                                       height="100"
                                       unoptimized
                                       className="size-8 rounded-full bg-gray-50" />  

                                   <span className="hidden lg:flex lg:items-center">
                                       <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-white">
                                           {fullName}
                                       </span>
                                       <EllipsisVerticalIcon aria-hidden="true" className="ml-2 size-5 text-white" />
                                   </span>
                               </MenuButton>
                               <MenuItems
                               modal={false}
                                   transition
                                   className={clsx(!onSmallScreen&&"bottom-full","absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in")}
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
                           </>
    )
}
