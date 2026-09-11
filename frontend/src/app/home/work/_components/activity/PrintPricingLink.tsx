 
import {  PrinterIcon } from '@heroicons/react/20/solid';  
import Link from 'next/link';
import { labels } from '@/_lib/labels';

 
export default function PrintPricingLink({
    id,
    pricingName, 
}:{
    id:string ,
    pricingName:string,
}) {
    
     
    // Opens in a new tab and renders a printable document server side, so prefetching it would do
    // that work for a link most rows never have clicked.
    return (
      <Link prefetch={false} href={`/print/${pricingName}/${id}`} target='_blank'  className="font-medium text-accent-ink hover:underline">
        <PrinterIcon aria-hidden="true" className="h-6 w-5 text-muted" ></PrinterIcon><span className="sr-only">{labels.actions.print}</span>
     </Link>
    )
} 