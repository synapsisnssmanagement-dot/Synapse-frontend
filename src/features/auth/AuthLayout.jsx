import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/brand/Logo";

// Split editorial layout shared by sign in, sign up and verification.
export default function AuthLayout({ image, imageAlt, eyebrow, statement, caption, children }) {
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <Image src={image} alt={imageAlt} fill priority sizes="45vw" className="object-cover opacity-75" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-white xl:p-14">
          <Link href="/" aria-label="Synapsis home" className="w-fit">
            <Logo tone="dark" />
          </Link>
          <div>
            <p className="eyebrow flex items-center gap-3 text-brand">
              <span aria-hidden="true" className="h-px w-8 bg-brand" />
              {eyebrow}
            </p>
            <p className="mt-6 max-w-[16ch] font-semibold text-white text-display-md">{statement}</p>
            {caption ? <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-on-dark/70">{caption}</p> : null}
          </div>
          <p className="eyebrow text-on-dark/45">Not me, but you</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex h-18 shrink-0 items-center justify-between gap-4 px-5 sm:px-10">
          <Link href="/" aria-label="Synapsis home" className="lg:invisible">
            <Logo size="sm" />
          </Link>
          <Link href="/" className="group inline-flex items-center gap-2 text-[13px] font-semibold text-fg-2 hover:text-ink">
            <ArrowLeft aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Back to site
          </Link>
        </div>
        <main id="main" className="flex flex-1 justify-center px-5 pb-16 pt-6 sm:px-10 sm:pt-10 lg:items-center lg:pt-0">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
