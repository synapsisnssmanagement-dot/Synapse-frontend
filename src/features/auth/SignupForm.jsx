"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, Building2, Check, Circle, Mail, Phone, RotateCw, UserRound } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Input, PasswordInput, Select } from "@/components/ui/Field";
import { Accent } from "@/components/ui/PageHeader";
import UploadZone from "@/components/ui/UploadZone";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import AuthLayout from "./AuthLayout";

// Mirrors the backend's signup validation so problems surface before submit.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "case", label: "Upper and lower case letters", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "digit", label: "At least one number", test: (v) => /\d/.test(v) },
  { id: "special", label: "One of @ $ ! % * ? &", test: (v) => /[@$!%*?&]/.test(v) },
  { id: "allowed", label: "No other symbols or spaces", test: (v) => v.length > 0 && /^[A-Za-z\d@$!%*?&]+$/.test(v) },
];

const ROLE_CONFIG = {
  student: {
    title: "Join as a student volunteer",
    intro: "Track every event, hour and certificate from your first drive.",
    endpoint: "/api/students/studentsignup",
    institutionKey: "institution",
    document: false,
    image: "/Images/IMG2.png",
    imageAlt: "A student volunteer handing a meal to an elderly woman at a food drive",
    statement: (
      <>
        Every hour you give <Accent className="text-brand">counts.</Accent>
      </>
    ),
    caption: "Your NSS record — events, hours, levels and certificates — in one place from day one.",
  },
  teacher: {
    title: "Join as a teacher",
    intro: "Mark attendance, review grace marks and guide your volunteers.",
    endpoint: "/api/teacher/signup",
    institutionKey: "institutionId",
    document: true,
    image: "/Images/IMG4.png",
    imageAlt: "Volunteers and staff at an NSS blood donation drive",
    statement: (
      <>
        Guide the people who <Accent className="text-brand">show up.</Accent>
      </>
    ),
    caption: "Attendance in one pass, grace marks with a clear trail, and every event you supervise in view.",
  },
  coordinator: {
    title: "Register as a coordinator",
    intro: "Plan drives, build teams and see your unit's impact.",
    endpoint: "/api/coordinator/coordinatorsignup",
    institutionKey: "institutionId",
    document: true,
    image: "/Images/IMG4.png",
    imageAlt: "An NSS blood donation drive organised by a college unit",
    statement: (
      <>
        Run your unit with <Accent className="text-brand">clarity.</Accent>
      </>
    ),
    caption: "Events, people, recognition and donations — organised the way NSS actually works.",
  },
  alumni: {
    title: "Rejoin your unit as alumni",
    intro: "Mentor students, share memories and support the drives you care about.",
    endpoint: "/api/alumni/signup",
    institutionKey: "institution",
    document: false,
    image: "/Images/IMG3.png",
    imageAlt: "NSS volunteers spending an afternoon with elders at a care home",
    statement: (
      <>
        The unit that shaped you still <Accent className="text-brand">needs you.</Accent>
      </>
    ),
    caption: "Mentorship, testimonials and giving back — without losing touch with the people you served beside.",
  },
};

const STEPS = ["Account", "Institution", "Verification"];
const EMPTY = { name: "", email: "", phoneNumber: "", password: "", institutionId: "", department: "", talents: "", graduationYear: "" };

function PasswordRules({ value }) {
  return (
    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li key={rule.id} className={cx("flex items-center gap-2 text-[12.5px]", met ? "text-brand-700" : "text-muted")}>
            {met ? <Check aria-hidden="true" className="size-3.5" /> : <Circle aria-hidden="true" className="size-3" />}
            {rule.label}
            <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

function validateStep(step, form, files, config) {
  const errors = {};
  const currentYear = new Date().getFullYear();
  if (step === 0) {
    if (form.name.trim().length < 2) errors.name = "Enter your full name.";
    if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (form.phoneNumber.replace(/\D/g, "").length < 10) errors.phoneNumber = "Enter a phone number with at least 10 digits.";
    if (!PASSWORD_RULES.every((rule) => rule.test(form.password))) errors.password = "Your password doesn't meet every requirement yet.";
  }
  if (step === 1) {
    if (!form.institutionId) errors.institutionId = "Choose your institution.";
    if (!form.department.trim()) errors.department = "Enter your department.";
    if (config.role === "alumni") {
      const year = Number(form.graduationYear);
      if (!year || year < 1950 || year > currentYear) errors.graduationYear = `Enter a year between 1950 and ${currentYear}.`;
    }
  }
  if (step === 2 && config.document && !files.document) {
    errors.document = "A verification document is required so your institution can approve you.";
  }
  return errors;
}

function stepForServerMessage(message = "") {
  const m = message.toLowerCase();
  if (m.includes("email") || m.includes("exist") || m.includes("password") || m.includes("phone")) return 0;
  if (m.includes("institution") || m.includes("department")) return 1;
  return 2;
}

export default function SignupForm({ role }) {
  const config = { ...ROLE_CONFIG[role], role };
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState({ photo: null, document: null });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const institutions = useResource(() => api.get("/api/institution/getallinstitutes").then((res) => res.data?.institutions || []), []);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submit = async () => {
    setSubmitting(true);
    setServerError("");
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("email", form.email.trim());
    fd.append("phoneNumber", form.phoneNumber.trim());
    fd.append("password", form.password);
    fd.append("department", form.department.trim());
    fd.append(config.institutionKey, form.institutionId);
    if (role === "student") fd.append("talents", form.talents.trim());
    if (role === "alumni") fd.append("graduationYear", form.graduationYear);
    if (files.photo) fd.append("profileImage", files.photo);
    if (config.document && files.document) fd.append("verificationDocument", files.document);

    try {
      const res = await api.post(config.endpoint, fd);
      toast.success("Account created. Check your email for a verification code.");
      const params = new URLSearchParams({ id: res.data.userId, role: res.data.role || role, email: form.email.trim() });
      router.push(`/verifyotp?${params.toString()}`);
    } catch (error) {
      const message = errorMessage(error, "We couldn't create your account. Please try again.");
      const target = stepForServerMessage(message);
      setServerError(message);
      setStep(target);
      setSubmitting(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const stepErrors = validateStep(step, form, files, config);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;
    if (step < STEPS.length - 1) {
      setServerError("");
      setStep(step + 1);
      return;
    }
    submit();
  };

  const selectedInstitution = institutions.data?.find((inst) => inst._id === form.institutionId);

  return (
    <AuthLayout image={config.image} imageAlt={config.imageAlt} eyebrow={`Join as ${role}`} statement={config.statement} caption={config.caption}>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">{config.title}</h1>
      <p className="mt-2 text-[15px] text-muted">{config.intro}</p>

      <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Sign-up progress">
        {STEPS.map((label, index) => (
          <li key={label} aria-current={index === step ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={cx(
                "block h-1 rounded-full transition-colors duration-500",
                index < step ? "bg-ink" : index === step ? "bg-brand" : "bg-mist"
              )}
            />
            <span className={cx("eyebrow mt-2.5 block text-[0.62rem]", index <= step ? "text-fg" : "text-subtle")}>
              <span className="tabular">{String(index + 1).padStart(2, "0")}</span> {label}
              <span className="sr-only">{index < step ? " (done)" : index === step ? " (current)" : ""}</span>
            </span>
          </li>
        ))}
      </ol>

      {serverError ? (
        <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] leading-snug text-red-800">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="mt-7">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: reduce ? 0 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {step === 0 ? (
              <>
                <Input label="Full name" name="name" autoComplete="name" leading={UserRound} value={form.name} onChange={update} error={errors.name} required />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  leading={Mail}
                  placeholder="you@college.edu"
                  hint="We'll send a 6-digit verification code here."
                  value={form.email}
                  onChange={update}
                  error={errors.email}
                  required
                />
                <Input
                  label="Phone number"
                  name="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  leading={Phone}
                  placeholder="+91 98765 43210"
                  value={form.phoneNumber}
                  onChange={update}
                  error={errors.phoneNumber}
                  required
                />
                <div>
                  <PasswordInput
                    label="Password"
                    name="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={update}
                    error={errors.password}
                    required
                  />
                  <PasswordRules value={form.password} />
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div>
                  <Select
                    label="Institution"
                    name="institutionId"
                    value={form.institutionId}
                    onChange={update}
                    error={errors.institutionId}
                    placeholder={institutions.loading ? "Loading institutions" : "Choose your institution"}
                    disabled={institutions.loading || institutions.status === "error"}
                    required
                  >
                    {(institutions.data || []).map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name}
                      </option>
                    ))}
                  </Select>
                  {institutions.status === "error" ? (
                    <p className="mt-2 flex items-center gap-2 text-[13px] text-red-600">
                      We couldn&apos;t load institutions.
                      <button type="button" onClick={institutions.reload} className="inline-flex items-center gap-1 font-semibold text-ink">
                        <RotateCw aria-hidden="true" className="size-3.5" /> Retry
                      </button>
                    </p>
                  ) : institutions.data && !institutions.data.length ? (
                    <p className="mt-2 text-[13px] text-muted">No institutions are registered yet. Please ask your administrator to add yours.</p>
                  ) : null}
                </div>
                <Input
                  label="Department"
                  name="department"
                  leading={Building2}
                  placeholder="e.g. Social Work"
                  value={form.department}
                  onChange={update}
                  error={errors.department}
                  required
                />
                {role === "alumni" ? (
                  <Input
                    label="Graduation year"
                    name="graduationYear"
                    type="number"
                    inputMode="numeric"
                    min={1950}
                    max={new Date().getFullYear()}
                    placeholder="e.g. 2019"
                    value={form.graduationYear}
                    onChange={update}
                    error={errors.graduationYear}
                    required
                  />
                ) : null}
                {role === "student" ? (
                  <Input
                    label="Talents and skills"
                    name="talents"
                    placeholder="e.g. photography, first aid, public speaking"
                    hint="Optional. Coordinators use this to match you with the right drives."
                    value={form.talents}
                    onChange={update}
                  />
                ) : null}
              </>
            ) : null}

            {step === 2 ? (
              <>
                <UploadZone
                  label="Profile photo"
                  shape="avatar"
                  file={files.photo}
                  onChange={(file) => setFiles((prev) => ({ ...prev, photo: file }))}
                  hint="Helps your unit recognise you."
                />
                {config.document ? (
                  <UploadZone
                    label="Verification document"
                    accept="image/*,application/pdf"
                    required
                    file={files.document}
                    onChange={(file) => {
                      setFiles((prev) => ({ ...prev, document: file }));
                      setErrors((prev) => ({ ...prev, document: undefined }));
                    }}
                    error={errors.document}
                    hint="Your staff ID or appointment letter. Only administrators can see it."
                  />
                ) : null}
                <dl className="rounded-lg border border-line bg-canvas p-4 text-[13.5px]">
                  <div className="flex justify-between gap-4 py-1">
                    <dt className="text-muted">Name</dt>
                    <dd className="truncate font-medium text-fg">{form.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-1">
                    <dt className="text-muted">Email</dt>
                    <dd className="truncate font-medium text-fg">{form.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-1">
                    <dt className="text-muted">Institution</dt>
                    <dd className="truncate font-medium text-fg">{selectedInstitution?.name || "—"}</dd>
                  </div>
                </dl>
                <p className="text-[13px] leading-relaxed text-muted">
                  After you verify your email, your institution reviews the account before you can sign in.
                </p>
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 ? (
            <Button variant="outline" size="lg" icon={ArrowLeft} onClick={() => setStep(step - 1)} disabled={submitting}>
              Back
            </Button>
          ) : null}
          <Button type="submit" size="lg" className="flex-1" loading={submitting} arrow={step < STEPS.length - 1}>
            {step < STEPS.length - 1 ? "Continue" : submitting ? "Creating account" : "Create account"}
          </Button>
        </div>
      </form>

      <p className="mt-10 border-t border-line pt-6 text-[14px] text-fg-2">
        Already have an account?{" "}
        <Link href="/login" className="link-draw font-semibold text-ink">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
