import FormLabel from "./FormLabel";
import { IButtonClick } from "./PrimaryButton"
import { IInputOnChange } from "./FormInput"

export default function FormInputWithButton({
    name,
    label,
    defaultValue,
    onInputChange,
    onButtonClick,
    children
}:{
    name:string,
    label:string,
    defaultValue?: string |number|undefined,
    onInputChange?:IInputOnChange|undefined
    onButtonClick?:IButtonClick|undefined,
    children?:React.ReactNode
}){
    return (
        <>
        <FormLabel name={name} label={label}></FormLabel>
                <div className="mt-2  flex">
                    <div className="-mr-px grid grow grid-cols-1 focus-within:relative"> 
                        <input
                            id={name}
                            name={name}
                            defaultValue={defaultValue}
                            onChange={(e) => {
                               if(onInputChange)onInputChange(e);
                            }}
                            type="text"
                            className="block w-full rounded-l-md bg-white px-3 py-1.5  text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 sm:pl-2 text-sm/6 text-gray-900 outline-gray-300 placeholder:text-gray-400 focus:outline-accent-ink"
                        />
                    </div> 
                    <button
                        type="button"
                        onClick={(e) => {
                            if(onButtonClick) onButtonClick(e)
                        }}
                        className="flex shrink-0 items-center gap-x-1.5 rounded-r-md bg-accent px-3 py-2 text-sm font-semibold text-white outline-1 -outline-offset-1 outline-accent hover:bg-accent-hover focus:relative focus:outline-2 focus:-outline-offset-2 focus:outline-accent-ink"
                    >
                        {children}
                        Add
                    </button>
                </div>
        </>
    )
}