import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Gallery() {
  return (
    <div className="gradient-mesh-subtle min-h-[70vh] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
            <ImageIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">
            Gallery
          </h1>
          <p className="mt-4 text-slate-500">
            Photos and recaps from real LavernaEvents celebrations will be showcased here.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex h-28 items-center justify-center sm:h-36">
                <ImageIcon className="h-6 w-6 text-slate-300" />
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
