export default function FormCheckBox({
    label,
    name,
    defaultChecked,
}:{
    label:string,
    name:string,
    defaultChecked?:boolean | undefined
}){
    return(
        <fieldset>
        <div className="mt-6 space-y-6">
            <div className="flex gap-3">
                <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                        <input
                            defaultChecked={defaultChecked}
                            id={name}
                            name={name}
                            type="checkbox"

                            aria-describedby={name+'-description'}
                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-line bg-field checked:border-accent checked:bg-accent indeterminate:border-accent indeterminate:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:border-line disabled:bg-neutral-soft disabled:checked:bg-neutral-soft forced-colors:appearance-auto"
                        />
                        <svg
                            fill="none"
                            viewBox="0 0 14 14"
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                        >
                            <path
                                d="M3 8L6 11L11 3.5"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-0 group-has-checked:opacity-100"
                            />
                            <path
                                d="M3 7H11"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-0 group-has-indeterminate:opacity-100"
                            />
                        </svg>
                    </div>
                </div>
                <div className="text-sm/6">
                    <label htmlFor={name} className="font-medium text-ink">
                       {label}
                    </label>
                </div>
            </div>

        </div>
    </fieldset>
    )
}