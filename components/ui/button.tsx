import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-display tracking-wide uppercase",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--color-primary)] text-[var(--background)] hover:opacity-90 shadow-md",
                destructive:
                    "bg-[var(--color-danger)] text-white shadow-sm hover:opacity-90",
                outline:
                    "border border-[var(--color-border)] bg-transparent shadow-sm hover:bg-[var(--color-muted)] hover:text-[var(--foreground)]",
                secondary:
                    "bg-[var(--color-secondary)] text-white shadow-sm hover:opacity-80",
                ghost: "hover:bg-[var(--color-muted)] hover:text-[var(--foreground)]",
                link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
                premium: "bg-gradient-to-r from-[var(--color-gold)] to-orange-600 text-white hover:opacity-90 shadow-lg border border-orange-400/50",
                glass: "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground)] hover:bg-[var(--glass-border)] backdrop-blur-md shadow-sm",

                // Legacy / Game specific (kept for specific game actions)
                game: "bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-900/40 hover:from-amber-300 hover:to-amber-500 hover:shadow-amber-500/20 border border-amber-300/20",
            },
            size: {
                default: "h-10 px-6 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-12 rounded-lg px-8 text-base",
                icon: "h-9 w-9",
                xl: "h-14 rounded-xl px-10 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
