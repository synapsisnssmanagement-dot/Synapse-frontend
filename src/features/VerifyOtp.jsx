"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, MailCheck } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Accent } from "@/components/ui/PageHeader";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import AuthLayout from "./auth/AuthLayout";

const LENGTH = 6;

export default function VerifyOtp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const role = searchParams.get("role");
  const email = searchParams.get("email");

  const [digits, setDigits] = useState(() => Array(LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  const code = digits.join("");
  const focus = (index) => inputs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  const setFrom = (start, text) => {
    const clean = text.replace(/\D/g, "").slice(0, LENGTH - start);
    if (!clean) return;
    setDigits((prev) => {
      const next = [...prev];
      clean.split("").forEach((d, i) => {
        next[start + i] = d;
      });
      return next;
    });
    setError("");
    focus(start + clean.length);
  };

  const onKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index]) {
      event.preventDefault();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1 >= 0 ? index - 1 : 0] = "";
        return next;
      });
      focus(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!id || !role) {
      setError("This verification link is incomplete. Please sign up again to receive a new code.");
      return;
    }
    if (code.length !== LENGTH) {
      setError("Enter all 6 digits from the email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/otp/verify-otp", { id, otp: code, role });
      setVerified(true);
      toast.success(res.data?.message || "Email verified.");
      setTimeout(() => router.push("/login"), 1600);
    } catch (err) {
      setError(errorMessage(err, "That code didn't work. Check the email and try again."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      image="/Images/IMG3.png"
      imageAlt="NSS volunteers sharing a conversation with elders"
      eyebrow="Almost there"
      statement={
        <>
          One code between you and your <Accent className="text-brand">unit.</Accent>
        </>
      }
      caption="Verifying your email keeps accounts real, so institutions know exactly who they are approving."
    >
      <span className="flex size-12 items-center justify-center rounded-xl border border-brand/25 bg-mint text-brand-700">
        <MailCheck aria-hidden="true" className="size-5" />
      </span>
      <h1 className="mt-6 text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">Check your email</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        We sent a 6-digit code to {email ? <span className="font-semibold text-fg">{email}</span> : "your email address"}. It expires
        shortly, so enter it now.
      </p>

      {verified ? (
        <div role="status" className="mt-8 rounded-lg border border-brand/25 bg-mint px-4 py-4 text-[14px] text-brand-700">
          <p className="font-semibold">Email verified.</p>
          <p className="mt-1 text-fg-2">Your institution will review your account. Taking you to sign in.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8">
          <fieldset>
            <legend className="mb-3 text-[13px] font-semibold text-fg">Verification code</legend>
            <div className="flex gap-2 sm:gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputs.current[index] = el;
                  }}
                  value={digit}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={LENGTH}
                  aria-label={`Digit ${index + 1} of ${LENGTH}`}
                  aria-invalid={error ? true : undefined}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) {
                      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
                      return;
                    }
                    setFrom(index, value.slice(-LENGTH + index));
                  }}
                  onPaste={(event) => {
                    event.preventDefault();
                    setFrom(index, event.clipboardData.getData("text"));
                  }}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  onFocus={(event) => event.target.select()}
                  className={cx(
                    "tabular h-14 w-full min-w-0 rounded-lg border bg-paper text-center text-2xl font-semibold text-ink shadow-subtle transition-[border-color,box-shadow] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand/15 sm:h-16",
                    error ? "border-red-400" : digit ? "border-ink/40" : "border-line"
                  )}
                />
              ))}
            </div>
          </fieldset>

          {error ? (
            <p role="alert" className="mt-4 flex items-start gap-2 text-[13.5px] font-medium text-red-600">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth className="mt-8" loading={loading} disabled={code.length !== LENGTH}>
            {loading ? "Verifying" : "Verify email"}
          </Button>
        </form>
      )}

      <p className="mt-10 border-t border-line pt-6 text-[14px] text-fg-2">
        Didn&apos;t get a code? Check your spam folder, or{" "}
        <Link href={role ? `/signup/${role === "volunteer" ? "student" : role}` : "/signup/student"} className="link-draw font-semibold text-ink">
          sign up again
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
