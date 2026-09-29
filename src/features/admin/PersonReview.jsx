"use client";

import { useState } from "react";
import { Check, ExternalLink, FileText, Mail, Phone, X } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { LevelBadge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ConfirmDialog, Drawer } from "@/components/ui/Dialog";
import api, { errorMessage } from "@/lib/api";
import { formatDate, formatNumber, photoOf } from "@/lib/format";
import { documentUrl, isPdf } from "./people";

// Approve/reject with optimistic removal handled by the caller's onChanged.
export function useModeration(person, scope, onChanged) {
  const [busy, setBusy] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const run = async (target, action) => {
    const endpoint = action === "approve" ? scope.approve(target._id) : scope.reject(target._id);
    setBusy(`${action}:${target._id}`);
    try {
      await api.put(endpoint, {});
      toast.success(action === "approve" ? `${target.name} can now sign in.` : `${target.name} was rejected.`);
      onChanged(target, action === "approve" ? "active" : "rejected");
      setConfirming(null);
    } catch (error) {
      toast.error(errorMessage(error, `We couldn't ${action} ${target.name}. Please try again.`));
    } finally {
      setBusy(null);
    }
  };

  const approve = (target) => run(target, "approve");
  const requestReject = (target) => setConfirming(target);

  const dialog = (
    <ConfirmDialog
      open={Boolean(confirming)}
      onClose={() => setConfirming(null)}
      onConfirm={() => confirming && run(confirming, "reject")}
      loading={busy === `reject:${confirming?._id}`}
      title={`Reject ${confirming?.name || "this account"}?`}
      confirmLabel="Reject account"
      description={`They won't be able to sign in. Nothing is deleted — you can approve them later from the ${person.plural} directory.`}
    />
  );

  return { approve, requestReject, busy, dialog };
}

function Detail({ label, children }) {
  if (children == null || children === "" || children === "—") return null;
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-line py-3 text-[14px] last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-fg">{children}</dd>
    </div>
  );
}

export default function PersonReview({ open, onClose, target, person, institutionName, moderation }) {
  const doc = documentUrl(target);
  const status = target?.status || "pending";
  const approving = moderation.busy === `approve:${target?._id}`;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={`${person.title.replace(/s$/, "")} account`}
      title={target?.name || ""}
      size="lg"
      footer={
        target ? (
          <>
            {status !== "rejected" ? (
              <Button variant="danger-soft" icon={X} onClick={() => moderation.requestReject(target)}>
                Reject
              </Button>
            ) : null}
            {status !== "active" ? (
              <Button icon={Check} loading={approving} onClick={() => moderation.approve(target)}>
                Approve
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {target ? (
        <div>
          <div className="flex items-center gap-5">
            <Avatar src={photoOf(target)} name={target.name} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                {target.role === "volunteer" ? <StatusBadge status="active" label="Volunteer" /> : null}
                {target.level ? <LevelBadge level={target.level} /> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
                {target.email ? (
                  <a href={`mailto:${target.email}`} className="inline-flex items-center gap-1.5 text-fg-2 hover:text-brand-700">
                    <Mail aria-hidden="true" className="size-3.5" />
                    {target.email}
                  </a>
                ) : null}
                {target.phoneNumber ? (
                  <a href={`tel:${target.phoneNumber}`} className="inline-flex items-center gap-1.5 text-fg-2 hover:text-brand-700">
                    <Phone aria-hidden="true" className="size-3.5" />
                    {target.phoneNumber}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <dl className="mt-8 border-t border-line">
            <Detail label="Institution">{institutionName(target.institution)}</Detail>
            <Detail label="Department">{target.department}</Detail>
            <Detail label="Graduation year">{target.graduationYear}</Detail>
            <Detail label="Talents">{Array.isArray(target.talents) ? target.talents.join(", ") : target.talents}</Detail>
            <Detail label="Volunteer hours">{target.totalVolunteerHours ? `${formatNumber(target.totalVolunteerHours)} h` : null}</Detail>
            <Detail label="Signed up">{formatDate(target.createdAt, "long")}</Detail>
          </dl>

          {person.hasDocument ? (
            <section className="mt-8" aria-labelledby="doc-title">
              <h3 id="doc-title" className="eyebrow mb-3 text-muted">
                Verification document
              </h3>
              {doc ? (
                isPdf(doc) ? (
                  <a
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-4 text-sm font-semibold text-fg hover:border-line-strong"
                  >
                    <FileText aria-hidden="true" className="size-5 text-muted" />
                    Open the PDF document
                    <ExternalLink aria-hidden="true" className="ml-auto size-4 text-muted" />
                  </a>
                ) : (
                  <a href={doc} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-lg border border-line bg-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element -- uploaded document from an arbitrary host */}
                    <img src={doc} alt={`Verification document submitted by ${target.name}`} className="max-h-[420px] w-full object-contain" />
                    <span className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[13px] font-semibold text-fg-2 group-hover:text-brand-700">
                      <ExternalLink aria-hidden="true" className="size-3.5" /> Open full size
                    </span>
                  </a>
                )
              ) : (
                <p className="rounded-lg border border-dashed border-line-strong bg-canvas p-4 text-[13.5px] text-muted">
                  No document was uploaded with this account.
                </p>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
