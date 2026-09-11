import { Switch } from "@headlessui/react";

interface ISwitchChanged {
    (value: boolean): void
}

export default function FormSwitch({
    checked,
    defaultChecked,
    value,
    name,
    onChange,
    onClick,
    small,
    ariaLabel,
}: {
    checked?: boolean | undefined,
    defaultChecked?: boolean | undefined,
    value?: string | undefined,
    name?: string | undefined,
    small?: boolean | undefined,
    onChange?: ISwitchChanged,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    /** A switch renders as a bare button, so without this it reaches the accessibility tree
        with no name at all. The text beside it is a plain label with no control to bind to. */
    ariaLabel?: string | undefined,
}) {
    return (
        <>{
            small?
            <Switch
            checked={checked}
            value={value}
            defaultChecked={defaultChecked}
            onClick={onClick}
            name={name}
            onChange={onChange}
            aria-label={ariaLabel}
            className="  group relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-hidden data-checked:bg-accent"
        >
            <span
                aria-hidden="true"
                className="pointer-events-none inline-block size-3 transform rounded-full bg-white ring-0 shadow-sm transition duration-200 ease-in-out group-data-checked:translate-x-3"
            />
        </Switch>:
        <Switch
        checked={checked}
        defaultChecked={defaultChecked}
        value={value}
        name={name}
        onChange={onChange}
        onClick={onClick}
        aria-label={ariaLabel}
        className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-hidden data-checked:bg-accent"
    >
        <span
            aria-hidden="true"
            className="pointer-events-none inline-block size-5 transform rounded-full bg-white ring-0 shadow-sm transition duration-200 ease-in-out group-data-checked:translate-x-5"
        />
    </Switch>
        }</> 
    )
}