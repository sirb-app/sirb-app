"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Root wrapper for a styled dropdown menu.
 *
 * Renders Radix's DropdownMenu.Root, adding a `data-slot="dropdown-menu"` attribute and forwarding all received props.
 *
 * @returns The underlying `DropdownMenuPrimitive.Root` element.
 */
function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

/**
 * A thin wrapper around Radix's DropdownMenu Portal that adds a styling slot attribute.
 *
 * Forwards all received props to `DropdownMenuPrimitive.Portal` and sets `data-slot="dropdown-menu-portal"`,
 * enabling consistent styling/hooks for the dropdown portal element.
 *
 * @param props - Props forwarded to `DropdownMenuPrimitive.Portal`.
 * @returns A Portal element for rendering dropdown content outside the DOM hierarchy.
 */
function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

/**
 * Renders a styled dropdown trigger by wrapping Radix's DropdownMenu Trigger.
 *
 * Forwards all props to the underlying Radix Trigger and adds a `data-slot="dropdown-menu-trigger"` attribute
 * to support slot-based styling and selectors.
 */
function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

/**
 * Renders the dropdown menu content inside a Portal with built-in styling and animations.
 *
 * The component wraps `DropdownMenuPrimitive.Content` in a `Portal`, applies standardized
 * classes for appearance, positioning, overflow handling, and open/close animations, and
 * forwards all other props to the underlying Radix primitive. It also emits the
 * `data-slot="dropdown-menu-content"` attribute for styling hooks.
 *
 * @param sideOffset - Distance in pixels between trigger and content. Defaults to `4`.
 */
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

/**
 * A thin wrapper around Radix's DropdownMenu Group primitive.
 *
 * Forwards all props to `DropdownMenuPrimitive.Group` and adds a `data-slot="dropdown-menu-group"`
 * attribute to support styling and slot targeting. Preserves the original Radix behavior and accepted props.
 *
 * @returns A rendered `DropdownMenuPrimitive.Group` element.
 */
function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

/**
 * Styled dropdown menu item with optional inset and destructive variant.
 *
 * Renders a Radix DropdownMenu.Item with standard styling and data attributes. Use `inset` to apply inset spacing (for aligned indicators) and `variant` to switch visual intent (e.g., `"destructive"` for danger actions). All other props (including `className`) are forwarded to the underlying Radix primitive.
 *
 * @param inset - If true, applies inset spacing (adds left padding for indicators).
 * @param variant - Visual variant; `"destructive"` applies destructive/error styling. Defaults to `"default"`.
 * @returns The rendered DropdownMenu item element.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * Checkbox menu item for use inside DropdownMenu that renders a left-aligned check indicator.
 *
 * Wraps `DropdownMenuPrimitive.CheckboxItem`, applies the component's default styling and layout,
 * and renders a `CheckIcon` inside the primitive's `ItemIndicator` positioned to the left of the content.
 * Forwards all other props to the underlying Radix primitive.
 *
 * @param checked - Controlled checked state for the checkbox item.
 * @returns The rendered checkbox menu item element.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

/**
 * A styled wrapper around Radix UI's `RadioGroup` primitive for dropdown menus.
 *
 * Forwards all props to `DropdownMenuPrimitive.RadioGroup` and adds a `data-slot="dropdown-menu-radio-group"`
 * attribute to facilitate styling.
 *
 * @returns A `DropdownMenuPrimitive.RadioGroup` element with forwarded props and the `data-slot` attribute.
 */
function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

/**
 * A styled wrapper around Radix's RadioItem that includes a left-aligned radio indicator.
 *
 * Renders a RadioItem with preset styling, a left-positioned ItemIndicator containing a `CircleIcon`,
 * and forwards all props to `DropdownMenuPrimitive.RadioItem`.
 *
 * @param children - The content/label displayed for the radio item.
 * @returns A JSX element for use inside the dropdown menu.
 */
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/**
 * Styled wrapper around Radix's DropdownMenu Primitive Label.
 *
 * Renders a label for dropdown groups with the project's default typography and spacing.
 * Forwards all other props to `DropdownMenuPrimitive.Label`. When `inset` is true,
 * extra left padding is applied to align the label with inset menu items or icons.
 *
 * @param inset - If true, applies inset left padding (aligns with items that have leading indicators).
 * @returns A React element rendering a styled dropdown menu label.
 */
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

/**
 * Visual divider used inside the styled dropdown menu.
 *
 * Renders a thin, full‑width separator matching the menu's design system and exposes a
 * `data-slot="dropdown-menu-separator"` hook for styling overrides.
 *
 * @returns A React element representing the dropdown menu separator.
 */
function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

/**
 * Renders a right-aligned shortcut hint for a dropdown menu item.
 *
 * The component outputs a `<span>` with `data-slot="dropdown-menu-shortcut"`,
 * applies subdued, small, right-aligned styling, and forwards all native span props
 * (including `className`) to the rendered element.
 *
 * @returns A span element for displaying keyboard shortcuts or hints in a menu item.
 */
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

/**
 * Wrapper around Radix's `DropdownMenuPrimitive.Sub` that forwards all props and adds a `data-slot` attribute.
 *
 * Renders a sub-menu container (`DropdownMenuPrimitive.Sub`) with `data-slot="dropdown-menu-sub"` to enable styling/slot targeting.
 */
function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

/**
 * Styled wrapper around Radix's SubTrigger that adds layout, interaction styles, and a trailing chevron.
 *
 * Renders a dropdown sub-trigger with standardized classes and a right-facing chevron icon, forwards all other props to the underlying Radix primitive, and emits `data-slot="dropdown-menu-sub-trigger"`.
 *
 * @param inset - When true, applies inset styling (extra left padding) by setting `data-inset`, aligning the trigger with other indented items.
 */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

/**
 * Styled wrapper for Radix's DropdownMenu SubContent that applies default popover styles and animations.
 *
 * Merges any provided `className` with the component's base styling (layout, animations, shadow, border, and spacing)
 * and forwards all other props to `DropdownMenuPrimitive.SubContent`.
 *
 * @param className - Additional CSS classes appended to the default styling.
 * @returns The rendered `DropdownMenuPrimitive.SubContent` element.
 */
function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
