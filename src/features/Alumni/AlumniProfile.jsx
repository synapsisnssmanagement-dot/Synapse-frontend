"use client";

import { useState } from "react";
import { Building2, GraduationCap, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import UploadZone from "@/components/ui/UploadZone";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { photoOf } from "@/lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfileForm({ alumni, onSaved }) {
  const [values, setValues] = useState({
    name: alumni.name || "",
    email: alumni.email || "",
    department: alumni.department || "",
    graduationYear: alumni.graduationYear ? String(alumni.graduationYear) : "",
  });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const year = Number(values.graduationYear);
    const next = {};
    if (values.name.trim().length < 2) next.name = "Enter your name.";
    if (!EMAIL_RE.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (!values.department.trim()) next.department = "Enter your department.";
    if (!year || year < 1950 || year > new Date().getFullYear()) next.graduationYear = `Enter a year between 1950 and ${new Date().getFullYear()}.`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const form = new FormData();
    form.append("name", values.name.trim());
    form.append("email", values.email.trim());
    form.append("department", values.department.trim());
    form.append("graduationYear", String(year));
    if (photo) form.append("profileImage", photo);
    try {
      const res = await api.put("/api/alumni/profile", form);
      localStorage.setItem("name", values.name.trim());
      localStorage.setItem("email", values.email.trim());
      toast.success("Profile saved.");
      window.dispatchEvent(new Event("synapsis:profile-updated"));
      onSaved(res.data?.updated || { ...alumni, ...values });
      setPhoto(null);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Panel title="Photo">
        <UploadZone shape="avatar" file={photo} onChange={setPhoto} hint="Shown to students browsing mentors." />
      </Panel>
      <Panel title="Personal details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" name="name" leading={UserRound} value={values.name} onChange={update} error={errors.name} required />
          <Input label="Email" name="email" type="email" leading={Mail} value={values.email} onChange={update} error={errors.email} required />
          <Input label="Department" name="department" leading={Building2} value={values.department} onChange={update} error={errors.department} required />
          <Input label="Graduation year" name="graduationYear" type="number" inputMode="numeric" leading={GraduationCap} value={values.graduationYear} onChange={update} error={errors.graduationYear} required />
        </div>
      </Panel>
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export default function AlumniProfile() {
  const profile = useResource(() => api.get("/api/alumni/profile").then((res) => res.data?.data || null), []);
  const a = profile.data;

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" description="How students see you when they look for a mentor." />
      {profile.loading ? (
        <ProfileSkeleton />
      ) : profile.status === "error" || !a ? (
        <ErrorState title="We couldn't load your profile" error={profile.error} onRetry={profile.reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl bg-ink p-6 text-on-dark">
            <Avatar src={photoOf(a)} name={a.name} size="xl" className="ring-4 ring-white/10" />
            <p className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">{a.name}</p>
            <p className="mt-1 text-[13.5px] text-on-dark/60">{a.email}</p>
            <div className="mt-4">
              <Badge tone="live">Alumni{a.graduationYear ? ` · ${a.graduationYear}` : ""}</Badge>
            </div>
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Institution</dt>
                <dd className="text-right text-white">{a.institution?.name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Department</dt>
                <dd className="text-right text-white">{a.department || "—"}</dd>
              </div>
            </dl>
          </aside>
          <ProfileForm key={a._id} alumni={a} onSaved={(next) => profile.mutate({ ...a, ...next, institution: a.institution })} />
        </div>
      )}
    </>
  );
}
