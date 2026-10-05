import { Globe, Play, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/laverna-logo.png";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Get Started", to: "/register" },
  { label: "Log In", to: "/login" },
];

function Footer() {
  return (
    <footer className="bg-[var(--brand-navy)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3 lg:px-10">
        <div>
          <Link to="/" className="inline-flex items-center">
            <img 
              src={logo} 
              alt="LavernaEvents" 
              className="h-10 w-auto object-contain brightness-0 invert" 
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
            Celebrate. Connect. Cherish.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
            Quick Links
          </h2>
          <nav aria-label="Footer navigation" className="mt-4 flex flex-col items-start gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm text-white/70 transition-colors hover:text-[var(--brand-pink-light)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
            Follow Us
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <a
              href="#instagram"
              aria-label="Instagram"
              title="Instagram"
              className="rounded-md border border-white/20 p-2.5 text-white/75 transition-colors hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
            >
              <Globe aria-hidden="true" size={19} />
            </a>
            <a
              href="#linkedin"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="rounded-md border border-white/20 p-2.5 text-white/75 transition-colors hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
            >
              <Share2 aria-hidden="true" size={19} />
            </a>
            <a
              href="#youtube"
              aria-label="YouTube"
              title="YouTube"
              className="rounded-md border border-white/20 p-2.5 text-white/75 transition-colors hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
            >
              <Play aria-hidden="true" size={19} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-5 text-center text-xs text-white/55 sm:px-8 lg:px-10">
          © {new Date().getFullYear()} LavernaEvents. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
