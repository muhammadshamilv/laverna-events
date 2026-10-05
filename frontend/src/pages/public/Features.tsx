import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Features() {
  return (
    <div className="gradient-mesh-subtle min-h-[70vh] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">
            Features
          </h1>
          <p className="mt-4 text-slate-500">
            Payments, e-cards, WhatsApp invitations, venue booking, and AI photo sharing are
            all on their way. Full details on every feature will land here as each phase ships.
          </p>

          <Card className="mt-10 inline-block px-6 py-3 text-sm font-medium text-slate-500">
            A detailed feature breakdown is coming soon.
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
