import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarHeart,
  CalendarPlus,
  ClipboardCheck,
  Mail,
  MessageCircle,
  Send,
  Image as ImageIcon,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";
import logo from "@/assets/laverna-logo.png";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CORE_FEATURES = [
  {
    icon: CalendarHeart,
    title: "Create events",
    description: "Set up an event in minutes with dates, details, and packages tailored to you.",
  },
  {
    icon: Users,
    title: "Manage guests & RSVPs",
    description: "Track RSVPs and guest details in one organized dashboard.",
  },
  {
    icon: MessageCircle,
    title: "Multi-channel invitations",
    description: "Send digital invitations to guests over WhatsApp, email, and SMS.",
  },
  {
    icon: ImageIcon,
    title: "Event photo galleries",
    description: "Collect and share photos from your event in one shared gallery.",
  },
];

const EVENT_TYPES = [
  { title: "Weddings", description: "Multi-day celebrations with guest lists in the hundreds." },
  { title: "Birthdays", description: "Milestone birthdays made effortless to plan and host." },
  { title: "Corporate events", description: "Conferences, summits, and team celebrations." },
  { title: "Community meetups", description: "Gatherings that bring people together locally." },
];

export default function Home() {
  const { user } = useAuthStore();

  const primaryHref = user ? "/portal" : "/register";
  const primaryLabel = user ? "Open portal" : "Start planning";
  const secondaryHref = user ? "/portal" : "/login";
  const secondaryLabel = user ? "Account" : "Sign in";

  const QUICK_ACTIONS = [
    { icon: CalendarPlus, label: "Create event", to: primaryHref },
    { icon: Mail, label: "Digital invitations", to: primaryHref },
    { icon: MessageCircle, label: "WhatsApp invites", to: primaryHref },
    { icon: ClipboardCheck, label: "Guest RSVP", to: primaryHref },
    { icon: Send, label: "Email & SMS", to: primaryHref },
    { icon: ImageIcon, label: "Photo gallery", to: "/gallery" },
  ];

  return (
    <div className="pb-20">
      <section className="gradient-mesh-subtle px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="overflow-hidden rounded-[2rem] bg-white soft-shadow-lg"
          >
            <div
              className="relative flex flex-col items-center px-6 py-16 text-center text-white sm:px-12 sm:py-24"
              style={{ background: "var(--gradient-brand)" }}
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--brand-green)]/15" />
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10" />

              <div className="relative z-10 rounded-2xl bg-white/90 p-3">
                <img src={logo} alt="LavernaEvents" className="h-10 w-auto object-contain sm:h-12" />
              </div>

              <h1 className="relative z-10 mt-8 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
                Celebrate beautifully. Connect meaningfully.
              </h1>
              <p className="relative z-10 mt-4 max-w-xl text-white/85 sm:text-lg">
                Plan events, send digital invites, manage guests, and share memories, all from
                one beautifully simple platform.
              </p>

              <div className="relative z-10 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={primaryHref}
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }), "bg-white text-[var(--brand-pink)] hover:bg-white/90")}
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={secondaryHref}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/40 bg-transparent text-white hover:bg-white/10"
                  )}
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
            <h2 className="text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">
              Everything you need, in one place
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center soft-shadow transition-transform hover:-translate-y-1"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-slate-600 sm:text-sm">{action.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">
                Built for every kind of celebration
              </h2>
              <Link to="/gallery" className="text-sm font-semibold text-[var(--brand-pink)]">
                See gallery
              </Link>
            </div>

            <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-2">
              {EVENT_TYPES.map((eventType, index) => (
                <div
                  key={eventType.title}
                  className="min-w-[240px] overflow-hidden rounded-3xl border border-slate-100 bg-white soft-shadow"
                >
                  <div
                    className="h-32"
                    style={{
                      background:
                        index % 2 === 0
                          ? "var(--gradient-brand)"
                          : "linear-gradient(135deg, var(--brand-pink) 0%, var(--brand-green-dark) 100%)",
                    }}
                  />
                  <div className="p-4">
                    <p className="text-sm font-semibold text-[var(--brand-navy)]">{eventType.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{eventType.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="relative overflow-hidden rounded-[2rem] p-8 text-white sm:p-10"
            style={{ background: "linear-gradient(135deg, var(--brand-pink) 0%, var(--brand-pink-dark) 100%)" }}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--brand-gold)]/20" />
            <Sparkles className="h-8 w-8" />
            <h3 className="mt-4 text-2xl font-bold">Digital invitations</h3>
            <p className="mt-3 max-w-sm text-white/85">
              Design beautiful digital invitation cards and send them straight to your guests
              over WhatsApp, email, or SMS.
            </p>
            <Link
              to={primaryHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-6 border-white/40 bg-transparent text-white hover:bg-white/10")}
            >
              {user ? "Open portal" : "Get started"}
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
            <Card className="flex h-full flex-col justify-center p-8 sm:p-10">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-2xl font-bold text-[var(--brand-navy)]">Guest RSVP tracking</h3>
              <p className="mt-3 text-slate-500">
                See who's coming at a glance, follow up with guests who haven't responded, and
                keep your final headcount accurate.
              </p>
              <Link to={primaryHref} className={cn(buttonVariants({ variant: "primary", size: "sm" }), "mt-6 w-fit")}>
                {user ? "Open portal" : "Get started"}
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
            <h2 className="text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">Core features</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CORE_FEATURES.map((feature) => (
                <Card key={feature.title} className="p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-[var(--brand-navy)]">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white sm:px-12 sm:py-20"
            style={{ background: "var(--gradient-brand)" }}
          >
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[var(--brand-gold)]/15" />
            <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-white/10" />

            <h2 className="relative z-10 text-2xl font-bold sm:text-3xl">
              Ready to start planning your next event?
            </h2>
            <p className="relative z-10 mx-auto mt-3 max-w-xl text-white/85">
              Join LavernaEvents and bring your celebration to life with tools built for hosts
              who care about every detail.
            </p>
            <Link
              to={primaryHref}
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "relative z-10 mt-7 bg-white text-[var(--brand-pink)] hover:bg-white/90"
              )}
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}