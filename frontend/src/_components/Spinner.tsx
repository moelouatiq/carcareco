import clsx from "clsx"
import { labels } from "@/_lib/labels"

/**
 * The one spinner in the application.
 *
 * It announces itself, which is right when it stands alone in a button. Beside text that already
 * says the page is loading it would say it twice, so passing an empty label makes it decorative
 * and leaves the announcement to whatever wraps it.
 */
export default function Spinner({
    textWhite,
    label = labels.common.loading,
}: {
    textWhite?: boolean
    label?: string
}) {
    const decorative = label === ""

    return (
        <div
            className={clsx( textWhite?"text-white":"text-accent-ink","inline-block h-4 w-4 animate-spin rounded-full  border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]")}
            role={decorative ? undefined : "status"}
            aria-hidden={decorative ? true : undefined}>
            {!decorative && (
                <span
                    className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                >{label}</span>
            )}
        </div>
    )
}
