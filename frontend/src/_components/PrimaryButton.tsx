import { Button } from './ui/Button'

export interface IButtonClick {
    (event: React.MouseEvent): void
}

export default function PrimaryButton({
    id,
    children,
    onClick,
    className,
    disabled,
}: {
    id?: string | undefined,
    children: React.ReactNode,
    onClick?: IButtonClick,
    className?: string | undefined,
    disabled?: boolean | undefined
}) {
    return (
        <Button id={id} type="submit" tone="primary" disabled={disabled} className={className}
            onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>}>
            {children}
        </Button>
    )
}
