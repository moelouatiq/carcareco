import clsx from "clsx";
import { labels } from "@/_lib/labels";

export function DescriptionItem(
    {
        label,
        value,
        className,
    }: {
        label: string,
        value: string | number | null | undefined,
        className?: string| undefined,
    }
) {
    return (
        <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="text-[11px] font-medium tracking-wide text-muted uppercase sm:pt-0.5">{label}</dt>
            {value
                ? <dd className={clsx(className && className, "text-sm text-ink sm:col-span-2")}>{value}</dd>
                : <dd className="text-sm text-muted italic sm:col-span-2">{labels.common.notProvided}</dd>}
        </div>
    ) 
}