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
                    "bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-900/40 hover:from-amber-300 hover:to-amber-500 hover:shadow-amber-500/20 border border-amber-300/20",
                destructive:
                    "bg-gradient-to-b from-red-500 to-red-700 text-white shadow-sm hover:from-red-400 hover:to-red-600",
                outline:
                    "border border-zinc-700 bg-zinc-900/50 shadow-sm hover:bg-zinc-800 hover:text-white backdrop-blur-sm",
                secondary:
                    "bg-zinc-800 text-zinc-300 shadow-sm hover:bg-zinc-700 hover:text-white border border-zinc-700/50",
                ghost: "hover:bg-zinc-800/50 hover:text-white",
                link: "text-amber-500 underline-offset-4 hover:underline",
                premium: "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-900/40 border border-orange-400/50",
                glass: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-md shadow-sm"
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
