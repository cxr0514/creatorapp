import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variantClasses = {
    default: "border-transparent bg-primary text-white hover:bg-primary-hover",
    secondary: "border-transparent bg-card text-card-foreground hover:bg-surface",
    destructive: "border-transparent bg-accent-danger text-white hover:bg-red-700",
    outline: "text-card-foreground border-border"
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} {...props} />
  )
}

export { Badge }
