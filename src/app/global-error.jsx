"use client";

import { useEffect } from "react";
import "./globals.css";

// Last resort when the root layout itself fails, so it cannot rely on fonts or providers.
export default function GlobalError({ error, retry, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const tryAgain = retry || reset;
  return (
    <html lang="en">
      <body className="bg-paper font-sans">
        <main role="alert" className="container-editorial flex min-h-dvh flex-col justify-center py-24">
          <p className="eyebrow text-muted">Synapsis</p>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-ink">Something went wrong while loading Synapsis.</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-fg-2">Please try again. If the problem continues, refresh the page.</p>
          <div className="mt-8 flex gap-3">
            {tryAgain ? (
              <button type="button" onClick={() => tryAgain()} className="h-11 rounded-lg bg-ink px-5 text-sm font-semibold text-white">
                Try again
              </button>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the router may be unavailable here */}
            <a href="/" className="flex h-11 items-center rounded-lg border border-line-strong px-5 text-sm font-semibold text-ink">
              Back to Synapsis
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
