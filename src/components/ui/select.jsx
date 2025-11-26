import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef(({ className, children, value, onChange, ...props }, ref) => {
  return (
    <select
      ref={ref}
      value={value}
      onChange={onChange}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = "Select"

const SelectTrigger = Select
const SelectValue = ({ children }) => <>{children}</>
const SelectContent = ({ children }) => <>{children}</>
const SelectItem = ({ value, children }) => <option value={value}>{children}</option>

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }