import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Scene from "./Scene";
import { SectionLabel } from "./parts";
import { SIGNUP_ROLES } from "./content";

export default function FinalCta({ index = "11" }) {
  return (
    <Scene id="join" aria-labelledby="join-title" className="relative bg-ink text-on-dark">
      <div className="container-editorial pb-20 pt-24 sm:pt-32 lg:pb-28 lg:pt-44">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <SectionLabel index={index} tone="dark">
              Join Synapsis
            </SectionLabel>
            <h2 id="join-title" data-split="lines" className="mt-8 font-extrabold uppercase text-white text-display-xl">
              Your service <em className="font-display font-normal normal-case italic text-brand">matters.</em>
            </h2>
          </div>
          <p data-reveal className="max-w-sm text-[16px] leading-relaxed text-on-dark/65 lg:col-span-3 lg:col-start-10 lg:self-end">
            Choose how you take part. Accounts are reviewed by your institution before they are activated.
          </p>
        </div>

        <ul className="mt-16 border-t border-white/15 lg:mt-24">
          {SIGNUP_ROLES.map((item, i) => (
            <li key={item.role} data-reveal className="border-b border-white/15">
              <Link
                href={item.href}
                data-cursor="Join"
                className="group relative isolate grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 overflow-hidden py-7 transition-colors duration-500 hover:text-ink focus-visible:text-ink sm:py-9 lg:grid-cols-[5rem_1fr_1fr_3rem] lg:px-4"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 origin-left scale-x-0 bg-brand transition-transform duration-700 ease-out-expo group-hover:scale-x-100 group-focus-visible:scale-x-100"
                />
                <span className="tabular hidden text-sm font-semibold text-on-dark/40 transition-colors group-hover:text-ink/60 lg:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[clamp(2rem,5vw,4.25rem)] font-semibold leading-none tracking-[-0.045em] text-white transition-colors duration-500 group-hover:text-ink group-focus-visible:text-ink">
                  {item.role}
                </span>
                <span className="col-start-1 row-start-2 text-[15px] text-on-dark/60 transition-colors duration-500 group-hover:text-ink/75 lg:col-start-3 lg:row-start-1">
                  {item.blurb}
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="col-start-2 row-span-2 row-start-1 size-7 justify-self-end text-white transition-all duration-500 ease-out-expo group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink lg:col-start-4 lg:row-span-1"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p data-reveal className="mt-10 text-[15px] text-on-dark/60">
          Already part of a unit?{" "}
          <Link href="/login" className="link-draw font-semibold text-white">
            Sign in
          </Link>
        </p>
      </div>
    </Scene>
  );
}
