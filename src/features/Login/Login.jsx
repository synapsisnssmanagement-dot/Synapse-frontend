"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Field";
import { Accent } from "@/components/ui/PageHeader";
import api, { errorMessage } from "@/lib/api";
import { API_URL } from "@/utils/config";
import cx from "@/lib/cx";
import AuthLayout from "../auth/AuthLayout";

// The backend works out the account type from the email, so there's no role
// to pick; HOME maps the returned workspace to where it lives.
const HOME = {
  student: "/studentlayout/dashboard",
  teacher: "/teacherLayout",
  coordinator: "/coordinatorlayout",
  alumni: "/alumnilayout/dashboard",
  admin: "/adminpanel",
};

const OAUTH_ERRORS = {
  notregistered: "There is no Synapsis account for that Google address. Sign up first, then use Google to sign in.",
  invalidrole: "We couldn't work out which workspace to open. Please sign in with your email instead.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

export default function Login() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Only set when one email+password opens more than one account.
  const [choices, setChoices] = useState(null);
  const oauthError = searchParams.get("error");
  const bannerMessage = error || (oauthError ? OAUTH_ERRORS[oauthError.toLowerCase()] || oauthError : "");

  const update = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    if (error) setError("");
    if (choices) setChoices(null);
  };

  const signIn = async (workspace) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", { email: form.email.trim(), password: form.password, workspace });
      const { token, user } = res.data || {};
      if (!token || !user) throw new Error("missing token");

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("email", user.email || form.email.trim());
      if (user.name) localStorage.setItem("name", user.name);
      else localStorage.removeItem("name");

      toast.success("Signed in. Opening your workspace.");
      // Full reload so the socket connection picks up the new session.
      window.location.assign(HOME[user.role] || "/");
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.workspaces) {
        setChoices(err.response.data.workspaces);
      } else {
        setError(errorMessage(err, "We couldn't sign you in. Please try again."));
      }
      setLoading(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    signIn();
  };

  return (
    <AuthLayout
      image="/Images/IMG4.png"
      imageAlt="A volunteer smiling from a donor chair at an NSS blood donation drive"
      eyebrow="Welcome back"
      statement={
        <>
          Pick up where your unit <Accent className="text-brand">left off.</Accent>
        </>
      }
      caption="Events, hours, mentors and messages — all waiting in your workspace."
    >
      <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">Sign in to Synapsis</h1>
      <p className="mt-2 text-[15px] text-muted">Use the email you registered with. We&apos;ll open the right workspace for you.</p>

      {choices ? (
        <div className="mt-8 rounded-lg border border-line bg-canvas p-4">
          <p className="text-[13.5px] font-semibold text-fg">This email has more than one account. Which one?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {choices.map((c) => (
              <Button key={c.id} size="sm" variant="outline" disabled={loading} onClick={() => signIn(c.id)}>
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {bannerMessage ? (
        <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] leading-snug text-red-800">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate={false}>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          leading={Mail}
          placeholder="you@college.edu"
          value={form.email}
          onChange={update}
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={update}
          required
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="eyebrow text-[0.62rem] text-subtle">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <a
        href={`${API_URL}/api/auth/google`}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line-strong bg-paper text-sm font-semibold text-fg transition-colors hover:border-fg hover:bg-canvas"
      >
        <GoogleMark />
        Continue with Google
      </a>
      <p className="mt-3 text-center text-[12.5px] text-muted">Google sign-in works for accounts that already exist.</p>

      <div className="mt-10 border-t border-line pt-6 text-[14px] text-fg-2">
        New to Synapsis?{" "}
        <span className="text-muted">Join as a </span>
        <Link href="/signup/student" className="link-draw font-semibold text-ink">
          student
        </Link>
        <span className="text-muted">, </span>
        <Link href="/signup/teacher" className="link-draw font-semibold text-ink">
          teacher
        </Link>
        <span className="text-muted">, </span>
        <Link href="/signup/coordinator" className="link-draw font-semibold text-ink">
          coordinator
        </Link>
        <span className="text-muted"> or </span>
        <Link href="/signup/alumni" className="link-draw font-semibold text-ink">
          alumni
        </Link>
        .
      </div>
    </AuthLayout>
  );
}
