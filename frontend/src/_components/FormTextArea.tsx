import { ChangeEvent } from "react";


interface ITextAreaOnChange {
    (event: ChangeEvent<HTMLTextAreaElement>): void
}

export default function FormTextArea({
    name,
    label,
    defaultValue, 
    value,
    rows = 3,
    placeholder,
    onInputChange,
}: {
    name: string,
    label?: string | undefined,
    rows?: number|undefined,
    defaultValue?: string | undefined, 
    value?: string | undefined, 
    placeholder?: string| undefined,
    onInputChange?: ITextAreaOnChange
}) {
 
    
    return (
        <>
            {label&&<label htmlFor={name} className="block text-sm/6 font-medium text-ink">
                {label}
            </label>}
            <div className="mt-2">
                <textarea
                    id={name}
                    name={name}
                    rows={rows}
                    value={value}
                    placeholder={placeholder}
                    onChange={onInputChange}
                    className="block w-full rounded-md bg-field px-3 py-1.5 text-base text-ink outline-1 -outline-offset-1 outline-line placeholder:text-muted focus:outline-2 focus:-outline-offset-2 focus:outline-accent-ink text-sm/6"
                    defaultValue={defaultValue}
                />
            </div> 
        </>
    )
}