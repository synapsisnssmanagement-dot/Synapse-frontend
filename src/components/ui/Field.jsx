"use client";

import { useId, useState } from "react";
import { AlertCircle, ChevronDown, Eye, EyeOff } from "lucide-react";
import cx from "@/lib/cx";

export const fieldBase =
  "w-full rounded-lg border border-line bg-paper text-[15px] text-fg shadow-subtle transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-subtle hover:border-line-strong focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-mist disabled:text-muted aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15";

function useFieldIds(id, hint, error) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { fieldId, hintId, errorId, describedBy };
}

export function FieldShell({ label, hint, error, required, fieldId, hintId, errorId, className, labelAside, children }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={fieldId} className="text-[13px] font-semibold text-fg">
            {label}
            {required ? (
              <span aria-hidden="true" className="ml-0.5 text-brand-700">
                *
              </span>
            ) : null}
          </label>
          {labelAside}
        </div>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-[13px] font-medium text-red-600">
          <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ label, hint, error, id, required, leading: Leading, trailing, className, containerClassName, labelAside, ...props }) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell {...{ label, hint, error, required, labelAside }} {...ids} className={containerClassName}>
      <div className="relative">
        {Leading ? (
          <Leading aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        ) : null}
        <input
          id={ids.fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cx(fieldBase, "h-11 px-3.5", Leading && "pl-10", trailing && "pr-11", className)}
          {...props}
        />
        {trailing ? <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div> : null}
      </div>
    </FieldShell>
  );
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-fg"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        </button>
      }
    />
  );
}

export function Textarea({ label, hint, error, id, required, className, containerClassName, rows = 4, ...props }) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell {...{ label, hint, error, required }} {...ids} className={containerClassName}>
      <textarea
        id={ids.fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cx(fieldBase, "resize-y px-3.5 py-3 leading-relaxed", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({ label, hint, error, id, required, className, containerClassName, children, placeholder, ...props }) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell {...{ label, hint, error, required }} {...ids} className={containerClassName}>
      <div className="relative">
        <select
          id={ids.fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cx(fieldBase, "h-11 appearance-none pl-3.5 pr-10", className)}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
}

export function Checkbox({ label, description, id, className, ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label htmlFor={fieldId} className={cx("group flex cursor-pointer items-start gap-3", className)}>
      <input
        id={fieldId}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-700"
        {...props}
      />
      {label ? (
        <span className="text-sm leading-snug">
          <span className="font-medium text-fg">{label}</span>
          {description ? <span className="mt-0.5 block text-[13px] text-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
