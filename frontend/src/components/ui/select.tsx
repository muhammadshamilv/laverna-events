import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-12 w-full appearance-none rounded-2xl border bg-white px-4 pr-10 text-sm text-[var(--brand-navy)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/40 disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-rose-300 focus:ring-rose-300/40"
              : "border-slate-200 focus:border-[var(--brand-pink)]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
