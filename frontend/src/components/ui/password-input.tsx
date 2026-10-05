import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  hasError?: boolean;
}

/**
 * A text Input with a show/hide toggle. Same visual language as Input
 * (same border/focus/error states) with an eye icon button absolutely
 * positioned inside the field.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, hasError, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(
            "h-12 w-full rounded-2xl border bg-white px-4 pr-11 text-sm text-[var(--brand-navy)] placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/40 disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-rose-300 focus:ring-rose-300/40"
              : "border-slate-200 focus:border-[var(--brand-pink)]",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          tabIndex={-1}
          className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-[var(--brand-navy)]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };