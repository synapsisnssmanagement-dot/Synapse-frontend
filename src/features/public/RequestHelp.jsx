"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, HandHeart, Send } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";

const CATEGORIES = ["Health", "Environment", "Education", "Elderly care", "Disaster relief", "Sanitation", "Other"];
const MAX_DESC = 1500;
const MIN_DESC = 30;

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function emptyForm(institution = "") {
  return {
    institution,
    orgName: "",
    contactName: "",
    phone: "",
    email: "",
    category: "Other",
    location: "",
    preferredDate: "",
    description: "",
  };
}

function validate(form) {
  const errors = {};
  if (!form.institution) errors.institution = "Choose the college you want help from.";
  if (!form.orgName.trim()) errors.orgName = "Enter your organisation's name.";
  if (!form.contactName.trim()) errors.contactName = "Enter a contact person.";
  if (form.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a phone number with at least 10 digits.";
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.location.trim()) errors.location = "Enter where the help is needed.";
  if (form.preferredDate && form.preferredDate < todayISO()) errors.preferredDate = "Pick today or a later date.";
  const len = form.description.trim().length;
  if (len < MIN_DESC) errors.description = `Describe what you need in at least ${MIN_DESC} characters.`;
  else if (len > MAX_DESC) errors.description = `Keep it under ${MAX_DESC} characters.`;
  return errors;
}

function RequestHelpForm() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("institution") || "";
  const [form, setForm] = useState(() => emptyForm(prefill));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sentTo, setSentTo] = useState(null);

  const institutes = useResource(async () => {
    const res = await api.get("/api/institution/getallinstitutes");
    return res.data?.institutions || [];
  }, []);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await api.post("/api/nss/public/requests", {
        institution: form.institution,
        orgName: form.orgName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        category: form.category,
        location: form.location.trim(),
        preferredDate: form.preferredDate,
        description: form.description.trim(),
      });
      setSentTo(form.phone.trim());
    } catch (error) {
      setServerError(errorMessage(error, "We couldn't send your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <div className="rounded-2xl border border-brand/25 bg-paper p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl border border-brand/20 bg-mint text-brand-700">
          <CheckCircle2 aria-hidden="true" className="size-6" />
        </span>
        <h2 className="mt-5 text-[1.3rem] font-semibold tracking-[-0.02em] text-fg">Request sent. Thank you.</h2>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-muted">
          The NSS unit has been notified and will contact you on <span className="font-semibold text-fg">{sentTo}</span>.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setForm(emptyForm(form.institution));
            setErrors({});
            setSentTo(null);
          }}
        >
          Send another request
        </Button>
      </div>
    );
  }

  const descLen = form.description.length;

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-2xl border border-line bg-paper p-5 sm:p-8">
      <div className="grid gap-5">
        {institutes.loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <Select
            label="College"
            required
            placeholder={institutes.status === "error" ? "Couldn't load colleges" : "Choose a college"}
            value={form.institution}
            onChange={set("institution")}
            error={errors.institution}
            hint={institutes.status === "error" ? "Refresh the page to try loading the list again." : undefined}
          >
            {(institutes.data || []).map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.name}
              </option>
            ))}
          </Select>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Organisation" required value={form.orgName} onChange={set("orgName")} error={errors.orgName} placeholder="e.g. Gram Panchayat, Kalyan" autoComplete="organization" />
          <Input label="Contact person" required value={form.contactName} onChange={set("contactName")} error={errors.contactName} autoComplete="name" />
          <Input label="Phone" required type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} hint="Optional" autoComplete="email" />
          <Select label="Type of help" value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input label="Preferred date" type="date" min={todayISO()} value={form.preferredDate} onChange={set("preferredDate")} error={errors.preferredDate} hint="Optional" />
        </div>

        <Input label="Location" required value={form.location} onChange={set("location")} error={errors.location} placeholder="Village, area or full address" />

        <Textarea
          label="What do you need?"
          required
          rows={6}
          maxLength={MAX_DESC}
          value={form.description}
          onChange={set("description")}
          error={errors.description}
          hint="How many volunteers, what they would do, and for how long."
        />
        <p aria-live="polite" className="-mt-3 text-right text-[12px] text-subtle tabular">
          {descLen}/{MAX_DESC} characters
        </p>
      </div>

      {serverError ? (
        <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] leading-snug text-red-800">
          <AlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      ) : null}

      <Button type="submit" icon={Send} loading={submitting} fullWidth className="mt-6">
        Send request
      </Button>
    </form>
  );
}

export default function RequestHelp() {
  return (
    <div className="min-h-screen bg-canvas px-4 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-8 text-ink" />
          <p className="eyebrow mt-4 text-muted">Request volunteer help</p>
          <h1 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.03em] text-fg">Need hands for a good cause?</h1>
          <p className="mt-2 flex max-w-md items-start gap-2 text-[14.5px] leading-relaxed text-muted">
            <HandHeart aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-700" />
            Tell a college&apos;s NSS unit what you need. No account required.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-[640px] w-full rounded-2xl" />}>
          <RequestHelpForm />
        </Suspense>
      </div>
    </div>
  );
}
