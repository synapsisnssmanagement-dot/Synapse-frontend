import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="container-editorial flex h-18 items-center">
        <Link href="/" aria-label="Synapsis home">
          <Logo size="sm" />
        </Link>
      </header>
      <main id="main" className="container-editorial flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow flex items-center gap-3 text-muted">
          <span className="tabular">404</span>
          <span aria-hidden="true" className="h-px w-10 bg-brand" />
          Page not found
        </p>
        <h1 className="mt-8 max-w-[14ch] font-semibold text-ink text-display-xl">
          This trail <em className="font-display font-normal italic text-brand-700">ends here.</em>
        </h1>
        <p className="mt-8 max-w-md text-[17px] leading-relaxed text-fg-2">
          The page you were looking for doesn&apos;t exist, or it has moved. Everything else is right where you left it.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/" arrow>
            Back to Synapsis
          </Button>
          <Button href="/login" variant="outline">
            Sign in
          </Button>
        </div>
      </main>
    </div>
  );
}
