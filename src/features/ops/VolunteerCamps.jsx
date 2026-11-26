"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tent } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { CampStatus } from "./campShared";

function Contact({ campId }) {
  const [f, setF] = useState({ name: "", relation: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/api/ops/camps/${campId}/emergency-contacts`, f);
      toast.success("Emergency contact saved. Only camp staff can see it.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-4 sm:items-end">
      <Input label="Emergency contact name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Input label="Relation" value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })} />
      <Input label="Phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <Button variant="outline" onClick={save} loading={busy}>
        Save contact
      </Button>
    </div>
  );
}

export default function VolunteerCamps() {
  const camps = useResource(() => api.get("/api/ops/camps").then((r) => r.data.camps), []);
  const apply = async (id) => {
    try {
      await api.post(`/api/ops/camps/${id}/apply`);
      toast.success("Applied. You'll be selected or placed on the waiting list.");
      camps.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <>
      <PageHeader eyebrow="Service" title="Special camps" description="Apply for approved camps and track your selection and documents. Your emergency contact is visible only to the camp's Programme Officer and supervisors." />
      {camps.status === "error" ? (
        <ErrorState error={camps.error} onRetry={camps.reload} />
      ) : !camps.data ? (
        <TableSkeleton />
      ) : camps.data.length ? (
        <div className="grid gap-3">
          {camps.data.map((c) => (
            <Panel key={c._id} title={c.title} description={`${formatDate(c.startDate)} – ${formatDate(c.endDate)}${c.site?.community ? ` · ${c.site.community}` : ""}`} actions={<CampStatus status={c.status} />}>
              {c.myApplication ? (
                <>
                  <p className="text-[14px]">
                    Your application: <strong>{c.myApplication.status}</strong>
                    {c.myApplication.note ? ` — ${c.myApplication.note}` : ""}
                  </p>
                  {["selected", "confirmed", "applied", "waitlisted"].includes(c.myApplication.status) ? <Contact campId={c._id} /> : null}
                </>
              ) : c.status === "approved" ? (
                <Button variant="dark" onClick={() => apply(c._id)}>
                  Apply
                </Button>
              ) : (
                <p className="text-[13px] text-muted">Applications are closed.</p>
              )}
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState icon={Tent} title="No camps open" description="Approved camps appear here." />
      )}
    </>
  );
}
