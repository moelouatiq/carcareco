import { Badge } from './ui/Badge'

// Kept as a named colour so the many call sites do not all have to change at once; the appearance
// now comes from the palette rather than from a raw Tailwind colour.
export default function YellowBadge({
    title,
    text,
}: {
    title?: string,
    text: string
}) {
    return <Badge tone="amber" title={title}>{text}</Badge>
}
