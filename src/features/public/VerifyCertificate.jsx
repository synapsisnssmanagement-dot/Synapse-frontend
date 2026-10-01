"use client";

import { useParams } from "next/navigation";
import { Award, Building2, Calendar, Clock3, ShieldCheck, ShieldX, User } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Skeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-t border-line py-3.5 first:border-t-0">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-subtle" />
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="truncate text-[14.5px] font-semibold text-fg">{value}</p>
      </div>
    </div>
  );
}

export default function VerifyCertificate() {
  const params = useParams();
  const certId = String(params?.certId || "").toUpperCase();

  const result = useResource(async () => {
    try {
      const res = await api.get(`/api/public/verify/${certId}`);
      return res.data?.certificate || null;
    } catch (error) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  }, [certId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-8 text-ink" />
          <p className="eyebrow mt-4 text-muted">Certificate verification</p>
          <h1 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.03em] text-fg">Is this certificate genuine?</h1>
        </div>

        {result.loading ? (
          <div className="space-y-4 rounded-2xl border border-line bg-paper p-6">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : result.status === "error" ? (
          <div className="rounded-2xl border border-line bg-paper p-8 text-center">
            <p className="text-[14.5px] text-muted">We couldn&apos;t check this certificate right now. Try again in a moment.</p>
          </div>
        ) : result.data ? (
          <div className="overflow-hidden rounded-2xl border border-brand/25 bg-paper">
            <div className="flex items-center gap-3 bg-mint px-6 py-5">
              <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-brand-700" />
              <div>
                <p className="font-semibold text-brand-700">Certificate verified</p>
                <p className="text-[12.5px] text-brand-700/70">Issued through the Synapsis NSS platform&mdash;verified against our records.</p>
              </div>
            </div>
            <div className="px-6 py-2">
              <Row icon={User} label="Volunteer" value={result.data.studentName} />
              <Row icon={Building2} label="Department" value={result.data.department} />
              <Row icon={Award} label="Event" value={result.data.eventTitle} />
              <Row icon={Calendar} label="Event date" value={result.data.eventDate ? formatDate(result.data.eventDate) : null} />
              <Row icon={Clock3} label="Credited hours" value={result.data.hours != null ? `${result.data.hours} hours` : null} />
              <Row icon={Building2} label="Institution" value={result.data.institution} />
            </div>
            <p className="border-t border-line px-6 py-4 text-center text-[12px] text-subtle">
              Certificate ID: <span className="font-mono">{result.data.certId}</span>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <ShieldX aria-hidden="true" className="mx-auto size-8 text-red-600" />
            <p className="mt-4 font-semibold text-red-700">No certificate found</p>
            <p className="mt-2 text-[13.5px] text-red-700/70">
              There&apos;s no record matching &ldquo;{certId}&rdquo;. Check the ID and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
