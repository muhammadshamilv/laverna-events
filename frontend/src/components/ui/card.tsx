import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-slate-100 bg-white soft-shadow transition-shadow duration-200",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

interface FormErrorProps {
  message?: string;
}

function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      className="flex items-center gap-1.5 text-sm text-rose-600"
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

export { Card, FormError };
