import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { IWorkData } from "../model";
import { labels } from "@/_lib/labels";

export default function NoProducts({
    work, 
    activityId
}: {
    work: IWorkData, 
    activityId: string
}){
    const editUrl = `/home/work/${work.id}/${activityId}/edit/startfresh`;
    return ( <div className="text-center">
                            
        <h3 className="mt-2 text-sm font-semibold text-gray-900">{labels.work.noProducts}</h3> 
       {!work.issuance&& <div className="my-6">
          <Link href={editUrl}
            type="button"
            className="inline-flex items-center rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink border border-accent hover:bg-accent-hover"
          >
            <PlusIcon aria-hidden="true" className="mr-1.5 -ml-0.5 size-5" />
            Start
          </Link>
        </div>}
      </div>)
}