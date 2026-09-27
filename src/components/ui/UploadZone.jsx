"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, FileText, ImageUp, X } from "lucide-react";
import cx from "@/lib/cx";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file, accept) {
  if (!accept) return true;
  return accept.split(",").some((rule) => {
    const r = rule.trim();
    if (r.endsWith("/*")) return file.type.startsWith(r.slice(0, -1));
    if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r.toLowerCase());
    return file.type === r;
  });
}

// Drag-and-drop or click to choose a single file, with an image preview.
export default function UploadZone({
  label,
  hint,
  error,
  accept = "image/*",
  file,
  onChange,
  required = false,
  maxSizeMB = 5,
  shape = "wide",
  className,
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file || !file.type?.startsWith("image/")) return undefined;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URLs are an external resource that must be created and revoked with the file
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [file]);

  const pick = (chosen) => {
    if (!chosen) return;
    if (!matchesAccept(chosen, accept)) {
      setLocalError("That file type isn't supported here.");
      return;
    }
    if (chosen.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Please choose a file smaller than ${maxSizeMB} MB.`);
      return;
    }
    setLocalError("");
    onChange(chosen);
  };

  const shownError = localError || error;
  const describedBy = [hint && `${id}-hint`, shownError && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const isImage = file?.type?.startsWith("image/");

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="text-[13px] font-semibold text-fg">
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5 text-brand-700">
              *
            </span>
          ) : (
            <span className="ml-1.5 font-normal text-muted">(optional)</span>
          )}
        </label>
      ) : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files?.[0]);
        }}
        className={cx(
          "relative flex items-center gap-4 rounded-xl border border-dashed p-4 transition-colors",
          dragging ? "border-brand-600 bg-mint" : shownError ? "border-red-400 bg-red-50/40" : "border-line-strong bg-canvas hover:border-fg-2/40",
          shape === "avatar" && "flex-col py-6 text-center sm:flex-row sm:text-left"
        )}
      >
        <span
          className={cx(
            "relative flex shrink-0 items-center justify-center overflow-hidden border border-line bg-paper text-muted",
            shape === "avatar" ? "size-20 rounded-full" : "size-14 rounded-lg"
          )}
        >
          {preview && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : file ? (
            <FileText aria-hidden="true" className="size-5" />
          ) : (
            <ImageUp aria-hidden="true" className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {file ? (
            <>
              <p className="truncate text-sm font-semibold text-fg">{file.name}</p>
              <p className="text-[12.5px] text-muted">{formatSize(file.size)}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-fg">
                Drop a file here or{" "}
                <button type="button" onClick={() => inputRef.current?.click()} className="link-draw text-brand-700">
                  browse
                </button>
              </p>
              <p className="text-[12.5px] text-muted">
                {accept.includes("pdf") ? "Image or PDF" : "JPG or PNG"}, up to {maxSizeMB} MB
              </p>
            </>
          )}
        </div>
        {file ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-fg-2 hover:bg-mist"
            >
              Change
            </button>
            <button
              type="button"
              aria-label="Remove file"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-mist hover:text-fg"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          aria-describedby={describedBy}
          aria-invalid={shownError ? true : undefined}
          onChange={(event) => pick(event.target.files?.[0])}
          className="sr-only"
        />
      </div>

      {shownError ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] font-medium text-red-600">
          <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {shownError}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
