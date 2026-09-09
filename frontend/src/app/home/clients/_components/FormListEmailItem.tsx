import BlueBadge from '@/_components/BlueBadge'
import {
    EnvelopeIcon
} from '@heroicons/react/20/solid'
import { labels } from "@/_lib/labels";

export default function FormListEmailItem({
    mail,
    isPrimary
}:{
    mail:string,
    isPrimary:boolean
})
{
    return (
        <div className="flex w-0 flex-1 items-center">
        <EnvelopeIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
        <div className="ml-4 flex min-w-0 flex-1 gap-2">
            <span className="truncate font-medium">{mail}</span>
            {isPrimary &&<BlueBadge   text={labels.clients.primary} ></BlueBadge>}
        </div>
    </div> 
    )
}