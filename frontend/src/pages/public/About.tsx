import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function About() {
  return (
    <div className="gradient-mesh-subtle min-h-[70vh] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
            <Heart className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">
            About LavernaEvents
          </h1>
          <p className="mt-4 text-slate-500">
            LavernaEvents was built to make celebrating life's biggest moments effortless,
            connecting hosts, guests, and specialists on one warm, thoughtfully designed
            platform. We're just getting started, and this page will grow with our story.
          </p>

          <Card className="mt-10 inline-block px-6 py-3 text-sm font-medium text-slate-500">
            More about our team and mission, coming soon.
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
