"use client";

import { useState } from "react";
import { Building2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function ProfileForm({ admin, onSaved }) {
  const [values, setValues] = useState({
    name: admin.name || "",
    email: admin.email || "",
    phoneNumber: admin.phoneNumber || "",
    department: admin.department || "",
    password: "",
  });
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
    if (!EMAIL_RE.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (values.password && !PASSWORD_RE.test(values.password)) {
      next.password = "Use 8+ characters with upper and lower case, a number and one of @ $ ! % * ? &.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim(),
      department: values.department.trim(),
      ...(values.password ? { password: values.password } : {}),
    };
    try {
      await api.put("/api/admin/profile", payload);
      localStorage.setItem("name", payload.name);
      localStorage.setItem("email", payload.email);
      toast.success("Profile saved.");
      window.dispatchEvent(new Event("synapsis:profile-updated"));
      setValues((prev) => ({ ...prev, password: "" }));
      onSaved({ ...admin, ...payload });
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Panel title="Personal details" description="Shown to other administrators.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" name="name" leading={UserRound} value={values.name} onChange={update} error={errors.name} required />
          <Input label="Email" name="email" type="email" leading={Mail} value={values.email} onChange={update} error={errors.email} required />
          <Input label="Phone number" name="phoneNumber" type="tel" leading={Phone} value={values.phoneNumber} onChange={update} />
          <Input label="Department" name="department" leading={Building2} value={values.department} onChange={update} />
        </div>
      </Panel>
      <Panel title="Password" description="Leave blank to keep your current password.">
        <div className="max-w-md">
          <PasswordInput label="New password" name="password" autoComplete="new-password" value={values.password} onChange={update} error={errors.password} />
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

export default function AdminProfile() {
  const profile = useResource(() => api.get("/api/admin/profile").then((res) => res.data?.admin || null), []);

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" description="Keep your contact details current so other administrators can reach you." />
      {profile.loading ? (
        <ProfileSkeleton />
      ) : profile.status === "error" || !profile.data ? (
        <ErrorState title="We couldn't load your profile" error={profile.error} onRetry={profile.reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl bg-ink p-6 text-on-dark">
            <Avatar name={profile.data.name} size="xl" className="ring-4 ring-white/10" />
            <p className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white">{profile.data.name}</p>
            <p className="mt-1 text-[13.5px] text-on-dark/60">{profile.data.email}</p>
            <div className="mt-4">
              <Badge tone="live" icon={ShieldCheck}>
                {profile.data.role === "superadmin" ? "Super admin" : "Administrator"}
              </Badge>
            </div>
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Department</dt>
                <dd className="text-right text-white">{profile.data.department || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-on-dark/50">Member since</dt>
                <dd className="text-right text-white">{formatDate(profile.data.createdAt)}</dd>
              </div>
            </dl>
          </aside>
          <ProfileForm key={profile.data.updatedAt || profile.data._id} admin={profile.data} onSaved={(next) => profile.mutate(next)} />
        </div>
      )}
    </>
  );
}
