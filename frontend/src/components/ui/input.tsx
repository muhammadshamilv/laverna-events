import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border bg-white px-4 text-sm text-[var(--brand-navy)] placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/40 disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-rose-300 focus:ring-rose-300/40"
            : "border-slate-200 focus:border-[var(--brand-pink)]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
