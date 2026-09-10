'use server'
 
 
import Nav from './_components/layout/Nav'
import NavDialog from './_components/layout/NavDialog'
import ToastMessages from '@/_components/ToastMessages'  
import { redirect } from 'next/navigation';
import { getProfileImageCacheKey, getSessionFullName } from '@/_lib/server/session';
export default async function Layout({ children }: { children: React.ReactNode }) {
    
    const fullName = await getSessionFullName();

    if(!fullName) {
        redirect('/home/logout');
    }

    // The avatar is the heaviest thing on every page and it never changes within a session, so
    // the proxy lets the browser keep it. The key makes the URL specific to this login, which is
    // what makes a private cache safe on a browser several people sign into.
    const imageCacheKey = await getProfileImageCacheKey();
    const imageUrl = '/api/backend/users/profilepicture'
        + (imageCacheKey ? '?v=' + imageCacheKey : '')
    return (
        <>
            {/* <Timeout></Timeout> */}
            <ToastMessages></ToastMessages>
            <div className="min-h-full bg-app">
                {/* Desktop sidebar: 240px, light, separated by a hairline rather than a colour block. */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
                    <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-line bg-sidebar px-3">
                        <Nav imageUrl={imageUrl} fullName={fullName} onSmallScreen={false}></Nav>
                    </div>
                </div>
                <NavDialog imageUrl={imageUrl} fullName={fullName}></NavDialog>
                {children}
            </div>
        </>
    )
}
