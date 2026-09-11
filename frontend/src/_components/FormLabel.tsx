export default function FormLabel({
    name,
    label,
    children,
}: {
    name: string,
    label: string,
    children?: React.ReactNode
}) {
    return (
        <label htmlFor={name} className="block text-[13px] font-medium text-ink">
            {label}{children}
        </label>
    )
}
