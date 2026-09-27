"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import Logo from "@/components/brand/Logo";
import Button from "@/components/ui/Button";

export default function RootError({ error, retry, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const tryAgain = retry || reset;
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="container-editorial flex h-18 items-center">
        <Link href="/" aria-label="Synapsis home">
          <Logo size="sm" />
        </Link>
      </header>
      <main id="main" role="alert" className="container-editorial flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow flex items-center gap-3 text-muted">
          <span aria-hidden="true" className="h-px w-10 bg-danger" />
          Something went wrong
        </p>
        <h1 className="mt-8 max-w-[16ch] font-semibold text-ink text-display-lg">
          We couldn&apos;t show this page <em className="font-display font-normal italic text-brand-700">right now.</em>
        </h1>
        <p className="mt-6 max-w-md text-[17px] leading-relaxed text-fg-2">
          It&apos;s on our side, not yours. Try again in a moment — if it keeps happening, head back to the home page.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          {tryAgain ? (
            <Button variant="dark" icon={RotateCw} onClick={() => tryAgain()}>
              Try again
            </Button>
          ) : null}
          <Button href="/" variant="outline">
            Back to Synapsis
          </Button>
        </div>
      </main>
    </div>
  );
}
