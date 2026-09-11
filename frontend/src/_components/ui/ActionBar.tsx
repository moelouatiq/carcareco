'use client'

import Link from 'next/link'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisHorizontalIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { Button, ButtonLink } from './Button'
import type { IButtonOption } from '@/_components/ButtonGroup'
import { labels } from '@/_lib/labels'

/**
 * Renders an existing IButtonOption list on the design system instead of the legacy segmented
 * group. The option shape is unchanged on purpose: every call site keeps the exact conditions
 * that decide which actions exist in which state.
 *
 * An option with no onClick submits the surrounding form, which is how the activity editor saves.
 */
export function ActionBar({
  options,
  menuLabel,
  className,
}: {
  options: IButtonOption[]
  menuLabel?: string
  className?: string
}) {
  const inline = options.filter(option => !option.inMenu)
  const inMenu = options.filter(option => option.inMenu)

  if (options.length === 0) return null

  const tone = (option: IButtonOption) =>
    option.isPrimary ? 'primary' : option.redText ? 'danger' : 'secondary'

  return (
    <div className={clsx('flex flex-wrap items-center gap-2', className)}>
      {inline.map((option, index) =>
        option.href ? (
          <ButtonLink key={index} href={option.href} tone={tone(option)}>
            {option.name}
          </ButtonLink>
        ) : (
          <Button
            key={index}
            type={option.onClick ? 'button' : 'submit'}
            tone={tone(option)}
            onClick={option.onClick}
          >
            {option.name}
          </Button>
        ),
      )}

      {inMenu.length > 0 && (
        <Menu as="div" className="relative">
          <MenuButton
            aria-label={menuLabel ?? labels.nav.openOptions}
            className="inline-flex items-center justify-center rounded-md border border-line bg-surface px-2 py-2 text-muted transition-colors hover:bg-neutral-soft hover:text-ink"
          >
            <EllipsisHorizontalIcon aria-hidden="true" className="size-4" />
          </MenuButton>
          <MenuItems
            modal={false}
            transition
            anchor={{ to: 'bottom end', gap: 4 }}
            className="z-30 w-60 rounded-md border border-line bg-surface py-1 shadow-sm transition focus:outline-hidden data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
          >
            {inMenu.map((option, index) => {
              const itemClasses = clsx(
                'block w-full px-3 py-1.5 text-left text-sm data-focus:bg-app data-focus:outline-hidden',
                option.redText ? 'text-danger-ink data-focus:bg-danger-soft' : 'text-ink',
              )
              return (
                <MenuItem key={index}>
                  {option.href ? (
                    <Link href={option.href} className={itemClasses}>{option.name}</Link>
                  ) : (
                    <button type={option.onClick ? 'button' : 'submit'} onClick={option.onClick} className={itemClasses}>
                      {option.name}
                    </button>
                  )}
                </MenuItem>
              )
            })}
          </MenuItems>
        </Menu>
      )}
    </div>
  )
}
