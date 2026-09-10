import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import FormLabel from "@/_components/FormLabel";
import { controlClasses } from "@/_components/ui/Input";
import { labels } from "@/_lib/labels";
import clsx from "clsx";

// Label above, control below, exactly like FormInput: without a label this field sat higher than
// every other filter on its row.
export default async function SearchInput({ searchParams, placeholder }: { searchParams: Promise<Record<string, string>>, placeholder: string }) {
    const options = (await searchParams);
    return (
        <>
            <FormLabel name="searchText" label={labels.search.keyword}></FormLabel>
            <div className="relative mt-2">
                <MagnifyingGlassIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                />
                <input
                    id="searchText"
                    name="searchText"
                    type="text"
                    placeholder={placeholder}
                    defaultValue={options.searchText}
                    className={clsx(controlClasses, "pl-9")}
                />
            </div>
        </>
    )
}
