'use client'
import {  useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"; 
import Nav from './Nav';
import ProfileMenu from './ProfileMenu';
import { labels } from "@/_lib/labels";

export default function NavDialog({
  
  fullName,
  imageUrl,
}:{ 
  fullName:string,
  imageUrl:string
})
{
 
    const [sidebarOpen, setSidebarOpen] = useState(false)
    return (<>
           <Dialog open={sidebarOpen} onClose={()=>setSidebarOpen(false)} aria-label={labels.nav.primary} className="relative z-50 lg:hidden">
                    <DialogBackdrop
                      transition
                      className="fixed inset-0 bg-ink/40 transition-opacity duration-300 ease-linear data-closed:opacity-0"
                    />
          
                    <div className="fixed inset-0 flex">
                      <DialogPanel
                        transition
                        className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
                      >
                        <TransitionChild>
                          <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                            <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                              <span className="sr-only">{labels.nav.closeSidebar}</span>
                              <XMarkIcon aria-hidden="true" className="size-6 text-surface" />
                            </button>
                          </div>
                        </TransitionChild>
                        {/* Sidebar component, swap this element with another sidebar if you like */}
                        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-line bg-sidebar px-3 pb-2">
                          {/* Navigation is client side now, so the drawer is no longer torn down by a
                              page load: choosing a destination has to close it. */}
                          <div className="contents" onClick={(e) => {
                            if ((e.target as HTMLElement).closest('a')) setSidebarOpen(false)
                          }}>
                            <Nav fullName={fullName} imageUrl={imageUrl} onSmallScreen={true}></Nav>
                          </div>
                        </div>
                      </DialogPanel>
                    </div>
                  </Dialog>
                  <div className="sticky top-0 z-40 flex items-center gap-x-4 border-b border-line bg-sidebar px-4 py-3 sm:px-6 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-muted hover:text-ink lg:hidden">
            <span className="sr-only">{labels.nav.openSidebar}</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
          <div className="flex-1 truncate text-sm font-semibold text-ink">{labels.app.name}</div>
         
             {/* Profile dropdown */}
             <ProfileMenu fullName={fullName} imageUrl={imageUrl}  onSmallScreen={true}></ProfileMenu> 
        </div>
    </>)
}