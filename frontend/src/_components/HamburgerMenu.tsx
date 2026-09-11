import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { IButtonOption } from "./ButtonGroup";
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import Link from 'next/link';
import clsx from 'clsx';
import { labels } from "@/_lib/labels";

export default function HamburgerMenu({
    options,
    label,
}: {
    options: IButtonOption[],
    label?: string,
}) {
    const itemClasses = (redText?: boolean) => clsx(
        'block w-full px-3 py-1.5 text-left text-sm data-focus:bg-app data-focus:outline-hidden',
        redText ? 'text-danger-ink data-focus:bg-danger-soft' : 'text-ink',
    );
    if (options.length == 0) return <></>
    return (
        <Menu as="div" className="relative flex-none">
            <MenuButton
                aria-label={label ?? labels.nav.openOptions}
                className="inline-flex rounded-md p-1 text-muted transition-colors hover:bg-neutral-soft hover:text-ink">
                <EllipsisVerticalIcon aria-hidden="true" className="size-4" />
            </MenuButton>
            <MenuItems
                modal={false}
                transition
                anchor={{ to: 'bottom end', gap: 4 }}
                className="z-30 w-52 rounded-md border border-line bg-surface py-1 shadow-sm transition focus:outline-hidden data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
                {options.map((item) => (
                    <MenuItem key={item.name}>
                        {item.href ?
                            <Link href={item.href} className={itemClasses(item.redText)}>{item.name}</Link> :
                            <button type={(!item.onClick ? "submit" : "button")} onClick={item.onClick} className={itemClasses(item.redText)}>{item.name}</button>
                        }
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    )
}
