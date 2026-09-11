import { Card } from "@/_components/Card" 
import Narrow from "./Narrow"

export default async function Main({
    header,
    children,
    narrow=true
}:{
    narrow?:boolean | undefined
    children: React.ReactNode,
    header: React.ReactNode
}) {
    return (
       <> 
                <main className="lg:pl-60 pb-8">
                    <div className="min-w-0 px-4 py-6 sm:px-8">
                        {header}
                        {narrow ? <Narrow><Card>{children}</Card></Narrow> : <Card>{children}</Card>}
                        
                    </div>
                </main> 
                </>
    )
}