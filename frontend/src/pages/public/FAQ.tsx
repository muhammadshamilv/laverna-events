import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const FAQS = [
  {
    question: "How do I create an organizer account?",
    answer: "Click \"Get started\", fill in your details, and verify your mobile number with the OTP we send you.",
  },
  {
    question: "Is my mobile number required to sign in?",
    answer: "Yes. LavernaEvents uses your mobile number as your primary login identifier.",
  },
  {
    question: "When will event and guest management be available?",
    answer: "We're rolling out features in phases. Registration and login are live today, with more on the way.",
  },
];

export default function FAQ() {
  return (
    <div className="gradient-mesh-subtle min-h-[70vh] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
            <HelpCircle className="h-6 w-6" />
          </span>
          <h1 className="mt-6 text-3xl font-bold text-[var(--brand-navy)] sm:text-4xl">
            Frequently asked questions
          </h1>
        </motion.div>

        <div className="mt-10 space-y-4">
          {FAQS.map((faq) => (
            <Card key={faq.question} className="p-6 text-left">
              <p className="font-semibold text-[var(--brand-navy)]">{faq.question}</p>
              <p className="mt-2 text-sm text-slate-500">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
