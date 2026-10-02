"use client";

import { useState } from "react";
import { Building2, Phone, ShieldCheck, UserRound } from "lucide-react";
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
import api, { errorMessage } from "@/lib/api";
import { useCoordinatorProfile } from "./data";

function ProfileForm({ profile, onSaved }) {
  const [values, setValues] = useState({ name: profile.name || "", phone: profile.phone || "", department: profile.department || "" });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (values.name.trim().length < 2) next.name = "Enter your name.";
    if (values.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a phone number with at least 10 digits.";
    if (!values.department.trim()) next.department = "Enter your department.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const form = new FormData();
    form.append("name", values.name.trim());
    form.append("phone", values.phone.trim());
    form.append("department", values.department.trim());
    if (photo) form.append("profileImage", photo);
    try {
      const res = await api.put("/api/coordinator/updateProfile", form);
      toast.success("Profile saved.");
      window.dispatchEvent(new Event("synapsis:profile-updated"));
      localStorage.setItem("name", values.name.trim());
      onSaved({ ...profile, ...values, ...(res.data?.data || {}) });
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
        <UploadZone shape="avatar" file={photo} onChange={setPhoto} hint="Shown to your institution's teachers and volunteers." />
      </Panel>
      <Panel title="Personal details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" name="name" leading={UserRound} value={values.name} onChange={update} error={errors.name} required />
          <Input label="Phone number" name="phone" type="tel" leading={Phone} value={values.phone} onChange={update} error={errors.phone} required />
          <Input label="Department" name="department" leading={Building2} value={values.department} onChange={update} error={errors.department} required className="sm:col-span-2" />
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

export default function CoordinatorMyProfile() {
  const profile = useCoordinatorProfile();

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" description="Keep your details current so your institution and volunteers can reach you." />
      {profile.loading ? (
        <ProfileSkeleton />
      ) : profile.status === "error" || !profile.data ? (
        <ErrorState title="We couldn't load your profile" error={profile.error} onRetry={profile.reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl bg-ink p-6 text-on-dark">
            <Avatar src={profile.data.profileImage} name={profile.data.name} size="xl" className="ring-4 ring-white/10" />
            <p className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">{profile.data.name}</p>
            <p className="mt-1 text-[13.5px] text-on-dark/60">{profile.data.email}</p>
            <div className="mt-4">
              <Badge tone="live" icon={ShieldCheck}>
                Coordinator
              </Badge>
            </div>
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Institution</dt>
                <dd className="text-right text-white">{profile.data.institutionName || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Department</dt>
                <dd className="text-right text-white">{profile.data.department || "—"}</dd>
              </div>
            </dl>
          </aside>
          <ProfileForm key={profile.data.name} profile={profile.data} onSaved={(next) => profile.mutate(next)} />
        </div>
      )}
    </>
  );
}
