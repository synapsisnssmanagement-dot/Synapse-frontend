import Link from "next/link";
import Logo from "@/components/brand/Logo";
import { SIGNUP_ROLES } from "./content";

export default function SiteFooter({ links }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink text-on-dark">
      <div className="container-editorial pt-20 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <Logo tone="dark" />
            <p className="mt-8 font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-white">
              Serve with <em className="italic text-brand">purpose.</em>
            </p>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-on-dark/55">
              The management platform for National Service Scheme units — built for the people who give their time.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            <div>
              <p className="eyebrow text-on-dark/40">Explore</p>
              <ul className="mt-5 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="link-draw text-[15px] text-on-dark/80 hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-on-dark/40">Join as</p>
              <ul className="mt-5 space-y-3">
                {SIGNUP_ROLES.map((item) => (
                  <li key={item.role}>
                    <Link href={item.href} className="link-draw text-[15px] text-on-dark/80 hover:text-white">
                      {item.role}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-on-dark/40">Account</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/login" className="link-draw text-[15px] text-on-dark/80 hover:text-white">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/eventalbum" className="link-draw text-[15px] text-on-dark/80 hover:text-white">
                    Event album
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-white/10 py-6 text-[13px] text-on-dark/45 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Synapsis. Built for the National Service Scheme.</p>
          <p className="eyebrow text-[0.64rem]">Not me, but you</p>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none select-none px-[1vw] text-center font-extrabold uppercase leading-[0.72] tracking-[-0.06em] text-white/[0.06] text-[17.2vw]"
      >
        Synapsis
      </p>
    </footer>
  );
}
