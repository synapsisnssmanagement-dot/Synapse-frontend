"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";

export function SegmentError({ error, retry, reset, homeHref }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const tryAgain = retry || reset;
  return (
    <div role="alert" className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg">This page ran into a problem</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Something went wrong while showing it. Nothing you saved has been lost — try again, or go back to your dashboard.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {tryAgain ? (
            <Button variant="dark" icon={RotateCw} onClick={() => tryAgain()}>
              Try again
            </Button>
          ) : null}
          {homeHref ? (
            <Button href={homeHref} variant="outline">
              Back to dashboard
            </Button>
          ) : null}
        </div>
        {error?.digest ? <p className="mt-6 text-[12px] text-subtle">Reference: {error.digest}</p> : null}
      </div>
    </div>
  );
}

export function SegmentLoading() {
  return <PageSkeleton />;
}
