
import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-blue-900 text-white",
        variant === "outline" && "border border-slate-300 text-slate-900",
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }