import { ExclamationCircleIcon } from "@heroicons/react/16/solid"
import clsx from "clsx"
import { ChangeEvent } from "react";
import FormLabel from "./FormLabel";


export interface IInputOnChange {
    (event: ChangeEvent<HTMLInputElement>): void
}

export default function FormInput({
    name,
    label,
    defaultValue,
    value,
    type,
    inputError,
    placeholder,
    onInputChange,
    step,
    className,
}: {
    name: string,
    label?: string | undefined,
    defaultValue?: string | number | readonly string[] | undefined,
    value?: string | number | readonly string[] | undefined,
    type?: string | undefined,
    inputError?: string | undefined,
    placeholder?: string | undefined,
    onInputChange?: IInputOnChange,
    step?: string | undefined,
    className?: string | undefined
}) {
     
    let hasError = false;
    if (inputError) {
        hasError = true;
    } 
    return (
        <> 
            {label&&<FormLabel name={name} label={label}></FormLabel>}
            <div className="mt-2   grid grid-cols-1">
                <input
                    id={name}
                    name={name}
                    type={type}
                    step={step} 
                    onChange={onInputChange}
                    defaultValue={defaultValue}
                    value={value}

                    placeholder={placeholder}
                    autoComplete={name}
                    aria-invalid={hasError}
                    aria-describedby={name + '-error'}
                    className={clsx(className,
                        hasError ? "col-start-1 row-start-1 border-danger-ink text-danger-ink placeholder:text-danger-ink/60"
                            : "border-line text-ink placeholder:text-muted focus:border-accent"
                        , "block w-full rounded-md border bg-surface px-3 py-2 text-sm focus:outline-none")}
                />
                {hasError && <ExclamationCircleIcon
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-3 size-4 self-center justify-self-end text-danger-ink"
                />}
            </div>
            {hasError && <p id={name + '-error'} className="mt-1.5 text-[13px] text-danger-ink">
                {inputError}
            </p>}

        </>
    )
}

export function FormRadio({
    id,
    name,
    label,
    defaultChecked ,
    value,
    onChange,
}: {
    id: string,
    name: string,
    label?: string | undefined,
    defaultChecked?: boolean| undefined,
    value: string,
    onChange? : React.ChangeEventHandler<HTMLInputElement>
}){
    
    return (
       <>
        <input
        defaultChecked={defaultChecked}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type="radio"
        className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
      />
      {/* The radios in a group share one name, so htmlFor={name} pointed every label at the same
          non-existent element and left all of them unnamed. Each radio has its own id. */}
      <label htmlFor={id} className="block text-sm/6 text-nowrap font-medium text-gray-900">
      {label}
      </label>
      </>
    )
}