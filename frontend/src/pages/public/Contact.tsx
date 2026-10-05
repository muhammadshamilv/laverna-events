import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Contact() {
  return (
    <div className="gradient-mesh-subtle min-h-[70vh] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">
            Get in touch
          </h1>
          <p className="mt-4 text-slate-500">
            Have a question or want help planning your event? Reach out, we'd love to hear
            from you.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card className="flex flex-col items-center gap-2 p-6">
              <Mail className="h-5 w-5 text-[var(--brand-pink)]" />
              <p className="text-sm font-medium text-[var(--brand-navy)]">Email</p>
              <p className="text-sm text-slate-500">hello@lavernaevents.com</p>
            </Card>
            <Card className="flex flex-col items-center gap-2 p-6">
              <Phone className="h-5 w-5 text-[var(--brand-pink)]" />
              <p className="text-sm font-medium text-[var(--brand-navy)]">Phone</p>
              <p className="text-sm text-slate-500">+91 98765 43210</p>
            </Card>
            <Card className="flex flex-col items-center gap-2 p-6">
              <MapPin className="h-5 w-5 text-[var(--brand-pink)]" />
              <p className="text-sm font-medium text-[var(--brand-navy)]">Location</p>
              <p className="text-sm text-slate-500">Kochi, Kerala, India</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
