import clsx from "clsx";

export function CardHeader({
    title,
    description,
    children,
}: {
    title?: string | undefined,
    description?:string | undefined,
    children?: React.ReactNode
}) {
    return (
        <div className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                {title && <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">{title}</h3>
                    {description && <p className="mt-0.5 max-w-2xl text-[13px] text-muted">{description}</p>}
                </div>}
                {children}
            </div>
        </div>

    )
}

export async function Card({   header, children }: {  header?: React.ReactNode, children: React.ReactNode }) {
    return ( 
        <div className={clsx("overflow-hidden rounded-lg border border-line bg-surface")}>
            {header && <div className="border-b border-line">{header}</div>}
            <div className="overflow-hidden p-4">{children}</div>
        </div>
    );
}