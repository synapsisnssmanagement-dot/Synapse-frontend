"use client";

import { useState } from "react";
import { Building2, Phone, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { Badge, LevelBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import Progress from "@/components/ui/Progress";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import UploadZone from "@/components/ui/UploadZone";
import api, { errorMessage } from "@/lib/api";
import { formatNumber, photoOf } from "@/lib/format";
import { levelProgress, useStudentProfile } from "./data";

const talentsText = (t) => (Array.isArray(t) ? t.join(", ") : t || "");

function ProfileForm({ student, onSaved }) {
  const [values, setValues] = useState({
    name: student.name || "",
    phoneNumber: student.phoneNumber || "",
    department: student.department || "",
    talents: talentsText(student.talents),
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
    if (values.phoneNumber.replace(/\D/g, "").length < 10) next.phoneNumber = "Enter a phone number with at least 10 digits.";
    if (!values.department.trim()) next.department = "Enter your department.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const form = new FormData();
    form.append("name", values.name.trim());
    form.append("phoneNumber", values.phoneNumber.trim());
    form.append("department", values.department.trim());
    values.talents
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => form.append("talents", t));
    if (photo) form.append("profileImage", photo);
    try {
      const res = await api.put("/api/students/profile/edit", form);
      const saved = res.data?.student || {};
      localStorage.setItem("name", values.name.trim());
      toast.success("Profile saved.");
      onSaved({ ...student, ...saved, profileImage: saved.profileImage ? { url: saved.profileImage } : student.profileImage });
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
        <UploadZone shape="avatar" file={photo} onChange={setPhoto} hint="Shown to coordinators, teachers and mentors." />
      </Panel>
      <Panel title="Personal details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" name="name" leading={UserRound} value={values.name} onChange={update} error={errors.name} required />
          <Input label="Phone number" name="phoneNumber" type="tel" leading={Phone} value={values.phoneNumber} onChange={update} error={errors.phoneNumber} required />
          <Input label="Department" name="department" leading={Building2} value={values.department} onChange={update} error={errors.department} required />
          <Input
            label="Talents"
            name="talents"
            leading={Sparkles}
            hint="Separate with commas. Coordinators search by these."
            placeholder="e.g. photography, first aid"
            value={values.talents}
            onChange={update}
          />
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

export default function MyProfile() {
  const profile = useStudentProfile();
  const s = profile.data;
  const hours = Number(s?.totalVolunteerHours) || 0;
  const { current, next, pct } = levelProgress(hours);

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" description="How you appear to your unit, and the record you've built." />
      {profile.loading ? (
        <ProfileSkeleton />
      ) : profile.status === "error" || !s ? (
        <ErrorState title="We couldn't load your profile" error={profile.error} onRetry={profile.reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl bg-ink p-6 text-on-dark">
            <Avatar src={photoOf(s)} name={s.name} size="xl" className="ring-4 ring-white/10" />
            <p className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">{s.name}</p>
            <p className="mt-1 text-[13.5px] text-on-dark/60">{s.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="live">{s.role === "volunteer" ? "Volunteer" : "Student"}</Badge>
              {current ? <LevelBadge level={current.name} /> : null}
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="tabular text-3xl font-semibold text-brand">
                {formatNumber(Math.round(hours * 10) / 10)} <span className="text-base font-medium text-on-dark/60">hours</span>
              </p>
              <Progress dark className="mt-3" size="sm" value={pct} max={100} valueLabel={next ? `${Math.max(0, Math.ceil(next.minHours - hours))} h to ${next.name}` : "Platinum"} />
            </div>
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Institution</dt>
                <dd className="text-right text-white">{s.institution?.name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Grace marks</dt>
                <dd className="tabular text-right text-white">{s.graceMarks || 0}</dd>
              </div>
            </dl>
          </aside>
          <ProfileForm key={s._id} student={s} onSaved={(next2) => profile.mutate(next2)} />
        </div>
      )}
    </>
  );
}
