import { ChevronDownIcon } from '@heroicons/react/20/solid' 
import { ChangeEvent } from 'react'

export interface ISelectOnChange {
    (event: ChangeEvent<HTMLSelectElement>): void
}
 
export default function Select({
    id,
    name,
    defaultValue,
    value,
    onChange,
    children,
}:{
    id?: string | undefined,
    name?: string | undefined ,
    defaultValue?: string | undefined ,
    value?: string | number | undefined ,
    onChange?: ISelectOnChange,
    children?: React.ReactNode
}){
      
    return (
      <>
        <select
        id={id}
        name={name} 
        defaultValue={defaultValue}
        value={value}
        onChange={onChange }
        className="col-start-1 row-start-1 w-full appearance-none rounded-md border border-line bg-surface py-2 pr-8 pl-3 text-sm text-ink focus:border-accent focus:outline-none"
    >
        {children}
    </select>
    <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none col-start-1 row-start-1 mr-2 size-4 self-center justify-self-end text-muted"
    />
    </>
    )
}