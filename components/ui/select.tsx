"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const SelectContext = React.createContext<{
    value?: string
    onValueChange?: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => { } })

const Select = ({ children, value, onValueChange }: { children: React.ReactNode, value?: string, onValueChange?: (value: string) => void }) => {
    const [open, setOpen] = React.useState(false)
    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
    const { setOpen, open } = React.useContext(SelectContext)
    return (
        <button
            ref={ref}
            onClick={() => setOpen(!open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>(({ className, placeholder, ...props }, ref) => {
    const { value } = React.useContext(SelectContext)
    return (
        <span ref={ref} className={cn("block truncate", className)} {...props}>
            {value || placeholder}
        </span>
    )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "item-aligned" }>(({ className, children, position = "popper", ...props }, ref) => {
    const { open } = React.useContext(SelectContext)
    if (!open) return null
    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 bg-neutral-800 mt-1",
                position === "popper" && "translate-y-1",
                className
            )}
            {...props}
        >
            <div className="p-1">{children}</div>
        </div>
    )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(({ className, children, value, ...props }, ref) => {
    const { onValueChange, setOpen } = React.useContext(SelectContext)
    return (
        <div
            ref={ref}
            onClick={() => {
                onValueChange?.(value)
                setOpen(false)
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-neutral-700 cursor-pointer text-white",
                className
            )}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {/* Check icon could go here */}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
})
SelectItem.displayName = "SelectItem"

const SelectGroup = ({ children }: any) => <>{children}</>
const SelectLabel = ({ children }: any) => <div className="py-1.5 pl-8 pr-2 text-sm font-semibold">{children}</div>
const SelectSeparator = () => <div className="-mx-1 my-1 h-px bg-muted" />

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }
