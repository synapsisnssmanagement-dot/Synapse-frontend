"use client";

import { useState } from "react";
import { Building2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "react-toastify";
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

function ProfileForm({ teacher, onSaved }) {
  const [values, setValues] = useState({
    name: teacher.name || "",
    email: teacher.email || "",
    phoneNumber: teacher.phoneNumber || "",
    department: teacher.department || "",
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
    const next = {};
    if (values.name.trim().length < 2) next.name = "Enter your name.";
    if (!EMAIL_RE.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (values.phoneNumber.replace(/\D/g, "").length < 10) next.phoneNumber = "Enter a phone number with at least 10 digits.";
    if (!values.department.trim()) next.department = "Enter your department.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const form = new FormData();
    form.append("name", values.name.trim());
    form.append("email", values.email.trim());
    form.append("phoneNumber", values.phoneNumber.trim());
    form.append("department", values.department.trim());
    if (photo) form.append("profileImage", photo);
    try {
      const res = await api.put("/api/teacher/profile", form);
      toast.success("Profile saved.");
      localStorage.setItem("name", values.name.trim());
      localStorage.setItem("email", values.email.trim());
      onSaved(res.data?.teacher || { ...teacher, ...values });
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
        <UploadZone shape="avatar" file={photo} onChange={setPhoto} hint="Shown to your institution's coordinators and students." />
      </Panel>
      <Panel title="Personal details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" name="name" leading={UserRound} value={values.name} onChange={update} error={errors.name} required />
          <Input label="Email" name="email" type="email" leading={Mail} value={values.email} onChange={update} error={errors.email} required />
          <Input label="Phone number" name="phoneNumber" type="tel" leading={Phone} value={values.phoneNumber} onChange={update} error={errors.phoneNumber} required />
          <Input label="Department" name="department" leading={Building2} value={values.department} onChange={update} error={errors.department} required />
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

export default function TeacherProfile() {
  const profile = useResource(() => api.get("/api/teacher/profile").then((res) => res.data?.teacher || null), []);

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" description="Keep your details current so your institution and students can reach you." />
      {profile.loading ? (
        <ProfileSkeleton />
      ) : profile.status === "error" || !profile.data ? (
        <ErrorState title="We couldn't load your profile" error={profile.error} onRetry={profile.reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl bg-ink p-6 text-on-dark">
            <Avatar src={photoOf(profile.data)} name={profile.data.name} size="xl" className="ring-4 ring-white/10" />
            <p className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">{profile.data.name}</p>
            <p className="mt-1 text-[13.5px] text-on-dark/60">{profile.data.email}</p>
            <div className="mt-4">
              <Badge tone={profile.data.status === "active" ? "live" : "warning"} icon={ShieldCheck}>
                {profile.data.status === "active" ? "Teacher" : "Pending approval"}
              </Badge>
            </div>
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Department</dt>
                <dd className="text-right text-white">{profile.data.department || "—"}</dd>
              </div>
            </dl>
          </aside>
          <ProfileForm key={profile.data.email} teacher={profile.data} onSaved={(next) => profile.mutate(next)} />
        </div>
      )}
    </>
  );
}
