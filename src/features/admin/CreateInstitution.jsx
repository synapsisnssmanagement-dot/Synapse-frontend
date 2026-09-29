"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import api, { errorMessage } from "@/lib/api";
import InstitutionFields, { useInstitutionForm } from "./InstitutionForm";

export default function CreateInstitution() {
  const router = useRouter();
  const form = useInstitutionForm();
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    const payload = Object.fromEntries(Object.entries(form.values).map(([k, v]) => [k, v.trim()]));
    try {
      await api.post("/api/institution/create", payload);
      toast.success(`${payload.name} was added.`);
      router.push("/adminpanel/manageinstitute");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't add the institution."));
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Institutions"
        title="Add an institution"
        description="Register a college so its students, teachers, coordinators and alumni can join Synapsis."
      />
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Institution details">
          <InstitutionFields form={form} />
        </Panel>
        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-canvas p-5 text-[14px] leading-relaxed text-fg-2">
            <p className="font-semibold text-fg">What happens next</p>
            <p className="mt-2">
              The institution appears in the sign-up form straight away. Its coordinators can then plan events and approve
              their own volunteers.
            </p>
          </div>
          <div className="flex gap-3">
            <Button href="/adminpanel/manageinstitute" variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Add institution
            </Button>
          </div>
        </aside>
      </form>
    </>
  );
}
