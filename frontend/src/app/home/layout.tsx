'use server'
 
 
import Nav from './_components/layout/Nav'
import NavDialog from './_components/layout/NavDialog'
import ToastMessages from '@/_components/ToastMessages'  
import { redirect } from 'next/navigation';
import { getSessionFullName } from '@/_lib/server/session';
export default async function Layout({ children }: { children: React.ReactNode }) {
    
    const fullName = await getSessionFullName();

    if(!fullName) {
        redirect('/home/logout');
    }

    const imageUrl = '/api/backend/users/profilepicture'
    return (
        <>
            {/* <Timeout></Timeout> */}
            <ToastMessages></ToastMessages>
            <div>
                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-62 lg:flex-col">
                    {/* Sidebar component, swap this element with another sidebar if you like */}
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6">
                      <Nav  imageUrl={imageUrl} fullName={fullName}  onSmallScreen={false}></Nav>   
                    </div>
                </div>
                 <NavDialog imageUrl={imageUrl} fullName={fullName} ></NavDialog>   
                {children}
              
              </div>
        </>
    )
}
