import { Button } from './ui/Button'
import { IButtonClick } from './PrimaryButton'

export default function SecondaryButton({
    children,
    onClick,
    className,
}: {
    children: React.ReactNode,
    onClick: IButtonClick,
    className?: string | undefined
}) {
    return (
        <Button tone="secondary" className={className}
            onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>}>
            {children}
        </Button>
    )
}
