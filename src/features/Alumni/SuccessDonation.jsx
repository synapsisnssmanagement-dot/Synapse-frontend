"use client";

import { useSearchParams } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import Button from "@/components/ui/Button";
import { Accent } from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/format";

export default function SuccessDonation() {
  const params = useSearchParams();
  const amount = Number(params.get("amount"));
  const eventName = params.get("eventName") || "the drive";

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-brand/25 bg-mint text-brand-700">
        <HeartHandshake aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-8 text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.04em] text-ink">
        Thank you. <Accent>Truly.</Accent>
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-fg-2">
        Your gift{Number.isFinite(amount) && amount > 0 ? ` of ${formatCurrency(amount)}` : ""} to <span className="font-semibold text-fg">{eventName}</span> was received. It goes straight to the volunteers running that drive.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button href="/alumnilayout/dashboard" variant="dark">
          Back to dashboard
        </Button>
        <Button href="/alumnilayout/donations" variant="outline">
          Support another drive
        </Button>
      </div>
    </div>
  );
}
