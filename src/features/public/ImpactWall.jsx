"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Building2, Calendar, HandHeart, Leaf, Link2, MapPin, Sparkles, Tent, Users } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CardGridSkeleton, Skeleton, StatRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";

const SUMMARY = [
  { key: "drives", label: "Drives completed" },
  { key: "volunteers", label: "Volunteers" },
  { key: "hours", label: "Service hours" },
  { key: "camps", label: "Special camps" },
];

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link");
  }
}

function DriveCard({ drive }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-paper">
      {drive.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={drive.cover} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-mint text-brand-700">
          <Leaf aria-hidden="true" className="size-7" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-fg">{drive.title}</h3>
          {drive.type === "special_camp" ? (
            <Badge tone="success" icon={Tent} size="sm">
              Special camp
            </Badge>
          ) : null}
        </div>
        <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
          <li className="flex items-center gap-2">
            <Calendar aria-hidden="true" className="size-3.5 shrink-0 text-subtle" />
            {formatDate(drive.date)}
          </li>
          {drive.location ? (
            <li className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-subtle" />
              <span className="truncate">{drive.location}</span>
            </li>
          ) : null}
          <li className="flex items-center gap-2">
            <Users aria-hidden="true" className="size-3.5 shrink-0 text-subtle" />
            {formatNumber(drive.volunteers || 0)} volunteers
          </li>
        </ul>
        {drive.impact?.length ? (
          <ul aria-label="Outcomes" className="mt-4 flex flex-wrap gap-1.5">
            {drive.impact.map((item) => (
              <li key={item.metric}>
                <Badge tone="neutral" size="sm">
                  <span className="tabular">{formatNumber(item.value)}</span> {item.unit || item.metric}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

export default function ImpactWall() {
  const params = useParams();
  const id = String(params?.institutionId || "");

  const result = useResource(async () => {
    try {
      const res = await api.get(`/api/nss/public/impact/${id}`);
      return res.data;
    } catch (error) {
      if (error?.response?.status === 404) return { notFound: true };
      throw error;
    }
  }, [id]);

  const requestHref = `/request-help?institution=${encodeURIComponent(id)}`;

  if (result.loading) {
    return (
      <div role="status" aria-busy="true" className="min-h-screen bg-canvas px-4 py-16">
        <span className="sr-only">Loading</span>
        <div className="mx-auto max-w-6xl space-y-10">
          <Skeleton className="h-10 w-2/3" />
          <StatRowSkeleton />
          <CardGridSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-canvas px-4 py-16">
        <ErrorState error={result.error} onRetry={result.reload} />
      </div>
    );
  }

  if (!result.data || result.data.notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-16">
        <EmptyState
          icon={Building2}
          title="We couldn't find that institution"
          description="The link may be out of date. Check it with the college that shared it."
          action={<Button href="/" variant="outline">Go to home</Button>}
        />
      </div>
    );
  }

  const { institution, summary = {}, impact = [], recent = [] } = result.data;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-ink px-4 py-14 text-on-dark sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark className="size-7 text-brand" />
              <p className="eyebrow text-on-dark/50">NSS impact</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline-dark" size="sm" icon={Link2} onClick={copyLink}>
                Copy link
              </Button>
              <Button href={requestHref} size="sm" icon={HandHeart}>
                Need volunteers? Request help
              </Button>
            </div>
          </div>
          <h1 className="mt-10 max-w-3xl text-[clamp(1.9rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
            {institution?.name}
          </h1>
          {institution?.address ? (
            <p className="mt-3 flex items-start gap-2 text-[14.5px] text-on-dark/60">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {institution.address}
            </p>
          ) : null}
          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 lg:grid-cols-4">
            {SUMMARY.map((s) => (
              <div key={s.key} className="bg-ink p-5 sm:p-6">
                <dt className="text-[12.5px] text-on-dark/50">{s.label}</dt>
                <dd className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-none tracking-[-0.03em] text-white tabular">
                  {formatNumber(summary[s.key] || 0)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <section aria-labelledby="outcomes-heading">
          <p className="eyebrow text-muted">What changed</p>
          <h2 id="outcomes-heading" className="mt-1 text-[1.5rem] font-semibold tracking-[-0.025em] text-fg">
            Outcomes
          </h2>
          {impact.length ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {impact.map((item) => (
                <li key={item.metric} className="rounded-xl border border-line bg-paper p-5">
                  <p className="text-[2rem] font-semibold leading-none tracking-[-0.03em] text-fg tabular">
                    {formatNumber(item.value)}
                  </p>
                  <p className="mt-3 text-[14px] font-semibold text-fg">{item.metric}</p>
                  {item.unit ? <p className="text-[12.5px] text-muted">{item.unit}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl border border-line bg-paper">
              <EmptyState
                size="sm"
                icon={Sparkles}
                title="No outcomes recorded yet"
                description="Results like trees planted or people screened will appear here once drives are completed."
              />
            </div>
          )}
        </section>

        <section aria-labelledby="drives-heading" className="mt-16">
          <p className="eyebrow text-muted">On the ground</p>
          <h2 id="drives-heading" className="mt-1 text-[1.5rem] font-semibold tracking-[-0.025em] text-fg">
            Recent drives
          </h2>
          {recent.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recent.map((drive) => (
                <DriveCard key={drive._id} drive={drive} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-line bg-paper">
              <EmptyState
                size="sm"
                icon={Calendar}
                title="No drives yet"
                description="Completed drives from this NSS unit will show up here."
                action={<Button href={requestHref} variant="outline" size="sm" icon={HandHeart}>Request help</Button>}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
