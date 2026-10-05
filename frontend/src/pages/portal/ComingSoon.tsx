import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
}

// Shared placeholder for portal nav destinations whose real feature isn't
// built yet (Gallery, Settings, Notifications) - used directly as a route
// element in App.tsx with per-page props, rather than three near-identical
// page files.
export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-md text-center">
        <Card className="p-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-[var(--brand-navy)]">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </Card>
      </div>
    </div>
  );
}
