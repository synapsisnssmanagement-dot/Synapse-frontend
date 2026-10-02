"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bell, CalendarDays, CalendarPlus, CheckCircle2, Clock3, HandHeart, MapPin, Presentation, Sparkles, Tent, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import UploadZone from "@/components/ui/UploadZone";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";

const STEPS = ["Details", "Date and place", "Cover photo", "Review"];
const EMPTY = { title: "", description: "", date: "", endDate: "", hours: "", location: "", caption: "", type: "regular", skills: "" };

const TYPES = [
  { id: "regular", label: "Regular drive", text: "A single-day activity: a cleanup, camp visit, awareness walk.", icon: HandHeart },
  { id: "special_camp", label: "Special camp", text: "The multi-day NSS residential camp, with daily roll call and a camp diary.", icon: Tent },
];

function todayInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function validate(step, values) {
  const errors = {};
  if (step === 0) {
    if (values.title.trim().length < 4) errors.title = "Give the event a clear name (at least 4 characters).";
    if (values.description.trim().length < 20) errors.description = "Describe the drive in a sentence or two (at least 20 characters).";
  }
  if (step === 1) {
    if (!values.date) errors.date = "Choose a date.";
    if (values.type === "special_camp") {
      if (!values.endDate) errors.endDate = "When does the camp end?";
      else if (values.date && values.endDate < values.date) errors.endDate = "The camp can't end before it starts.";
    }
    const hours = Number(values.hours);
    if (!values.hours || !Number.isFinite(hours) || hours <= 0 || hours > 24) errors.hours = "Enter the planned hours, between 1 and 24.";
    if (!values.location.trim()) errors.location = "Where is it happening?";
  }
  return errors;
}

function Preview({ values, image }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!image) return undefined;
    const next = URL.createObjectURL(image);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL lifecycle follows the chosen file
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
      setUrl(null);
    };
  }, [image]);

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className="relative aspect-[16/7] bg-ink">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-end p-6">
            <p className="tabular font-display text-6xl leading-none text-brand">{values.date ? new Date(values.date).getDate() : "--"}</p>
            <p className="mb-1 ml-3 text-sm font-semibold uppercase tracking-[0.12em] text-white">
              {values.date ? new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(values.date)) : ""}
            </p>
          </div>
        )}
        {values.caption && url ? <p className="absolute bottom-3 left-4 rounded-sm bg-ink/70 px-2 py-1 text-[12px] text-white">{values.caption}</p> : null}
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="upcoming" />
          {values.type === "special_camp" ? (
            <Badge tone="dark" icon={Tent}>
              Special camp
            </Badge>
          ) : null}
        </div>
        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">{values.title || "Untitled event"}</h3>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-fg-2">{values.description}</p>
        {values.skills.trim() ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {values.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
              <Badge key={skill} tone="neutral" size="sm">
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}
        <ul className="mt-5 grid gap-2.5 text-[14px] text-fg-2 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4 text-subtle" /> {formatDate(values.date, "long")}
            {values.type === "special_camp" && values.endDate ? ` to ${formatDate(values.endDate, "long")}` : ""}
          </li>
          <li className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="size-4 text-subtle" /> {values.hours || "—"} hours
          </li>
          <li className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 text-subtle" /> {values.location || "—"}
          </li>
        </ul>
      </div>
    </article>
  );
}

function Created({ event, onAnother }) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-brand/25 bg-mint text-brand-700">
        <CheckCircle2 aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-6 text-3xl font-semibold tracking-[-0.035em] text-ink">{event.title} is on the calendar</h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        Teachers and volunteers at your institution have been notified. Next, give the drive a team.
      </p>
      <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
        {[
          { href: "/coordinatorlayout/manageteacher", icon: Presentation, title: "Assign teachers", text: "They take attendance on the day." },
          { href: "/coordinatorlayout/managevolunteer", icon: Users, title: "Choose volunteers", text: "Pick who serves at this drive." },
        ].map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="group rounded-xl border border-line bg-paper p-5 transition-colors hover:border-ink">
            <Icon aria-hidden="true" className="size-5 text-brand-700" />
            <p className="mt-4 font-semibold text-fg">{title}</p>
            <p className="mt-1 text-[13.5px] text-muted">{text}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Button href="/coordinatorlayout/myevents" variant="outline">
          View my events
        </Button>
        <Button variant="ghost" icon={CalendarPlus} onClick={onAnother}>
          Create another
        </Button>
      </div>
    </div>
  );
}

function CreateEventForm() {
  const reduce = useReducedMotion();
  const params = useSearchParams();
  // Arriving from a community request pre-fills the drive from it.
  const requestId = params.get("request");
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    title: params.get("title") || "",
    description: params.get("description") || "",
    location: params.get("location") || "",
    date: params.get("date") && params.get("date") >= todayInputValue() ? params.get("date") : "",
  }));
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const update = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const publish = async () => {
    setSubmitting(true);
    const form = new FormData();
    form.append("title", values.title.trim());
    form.append("description", values.description.trim());
    form.append("date", values.date);
    form.append("hours", values.hours);
    form.append("location", values.location.trim());
    form.append("caption", values.caption.trim());
    form.append("type", values.type);
    if (values.type === "special_camp" && values.endDate) form.append("endDate", values.endDate);
    form.append("requiredSkills", values.skills);
    if (requestId) form.append("requestId", requestId);
    if (image) form.append("images", image);
    try {
      const res = await api.post("/api/coordinator/createevents", form);
      setCreated(res.data?.event || { title: values.title.trim() });
      toast.success("Event created.");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't create the event."));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const next = validate(step, values);
    setErrors(next);
    if (Object.keys(next).length) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else publish();
  };

  const reset = () => {
    setValues(EMPTY);
    setImage(null);
    setErrors({});
    setStep(0);
    setCreated(null);
  };

  return (
    <>
      <PageHeader eyebrow="Events" title="Create an event" description="Plan a drive in four short steps. You can assign teachers and volunteers once it exists." />

      {created ? (
        <Created event={created} onAnother={reset} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-12">
          <ol aria-label="Steps" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0">
            {STEPS.map((label, index) => (
              <li key={label} aria-current={index === step ? "step" : undefined} className="relative shrink-0 lg:pb-8 lg:last:pb-0">
                {index < STEPS.length - 1 ? (
                  <span aria-hidden="true" className={cx("absolute left-[15px] top-9 hidden h-[calc(100%-2.5rem)] w-px lg:block", index < step ? "bg-ink" : "bg-line")} />
                ) : null}
                <button
                  type="button"
                  disabled={index > step}
                  onClick={() => index < step && setStep(index)}
                  className="flex items-center gap-3 rounded-lg py-1 pr-3 text-left disabled:cursor-default"
                >
                  <span
                    className={cx(
                      "tabular flex size-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold",
                      index < step ? "border-ink bg-ink text-white" : index === step ? "border-brand bg-brand text-ink" : "border-line bg-paper text-subtle"
                    )}
                  >
                    {index < step ? <CheckCircle2 aria-hidden="true" className="size-4" /> : index + 1}
                  </span>
                  <span className={cx("whitespace-nowrap text-[14px] font-semibold", index <= step ? "text-fg" : "text-subtle")}>{label}</span>
                </button>
              </li>
            ))}
          </ol>

          <form onSubmit={onSubmit} noValidate className="min-w-0">
            <div className="rounded-xl border border-line bg-paper p-5 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  {step === 0 ? (
                    <>
                      {requestId ? (
                        <p className="flex items-start gap-3 rounded-lg border border-brand/25 bg-mint p-4 text-[14px] text-brand-700">
                          <HandHeart aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                          Planning a drive for a community request. Publishing marks the request as accepted.
                        </p>
                      ) : null}
                      <fieldset>
                        <legend className="mb-2 text-[13px] font-semibold text-fg">Kind of event</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {TYPES.map(({ id, label, text, icon: Icon }) => (
                            <label
                              key={id}
                              className={cx(
                                "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600",
                                values.type === id ? "border-ink bg-canvas" : "border-line hover:border-line-strong"
                              )}
                            >
                              <input
                                type="radio"
                                name="type"
                                value={id}
                                checked={values.type === id}
                                onChange={update}
                                className="sr-only"
                              />
                              <Icon aria-hidden="true" className={cx("mt-0.5 size-5 shrink-0", values.type === id ? "text-brand-700" : "text-subtle")} />
                              <span>
                                <span className="block text-[14px] font-semibold text-fg">{label}</span>
                                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{text}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <Input
                        label="Event name"
                        name="title"
                        placeholder="e.g. Coastal Cleanup Initiative"
                        value={values.title}
                        onChange={update}
                        error={errors.title}
                        required
                      />
                      <Textarea
                        label="What is the drive about?"
                        name="description"
                        rows={6}
                        placeholder="Who it helps, what volunteers will do, and anything they should bring."
                        hint={`${values.description.trim().length} characters. Volunteers read this before they sign up.`}
                        value={values.description}
                        onChange={update}
                        error={errors.description}
                        required
                      />
                      <Input
                        label="Skills needed"
                        name="skills"
                        leading={Sparkles}
                        placeholder="e.g. first aid, photography, Malayalam"
                        hint="Optional, comma-separated. Synapsis uses these to suggest the right volunteers."
                        value={values.skills}
                        onChange={update}
                      />
                    </>
                  ) : null}

                  {step === 1 ? (
                    <>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <Input
                          label={values.type === "special_camp" ? "Camp starts" : "Date"}
                          name="date"
                          type="date"
                          min={todayInputValue()}
                          leading={CalendarDays}
                          value={values.date}
                          onChange={update}
                          error={errors.date}
                          required
                        />
                        {values.type === "special_camp" ? (
                          <Input
                            label="Camp ends"
                            name="endDate"
                            type="date"
                            min={values.date || todayInputValue()}
                            leading={CalendarDays}
                            hint="Usually seven days. Each day gets its own roll call."
                            value={values.endDate}
                            onChange={update}
                            error={errors.endDate}
                            required
                          />
                        ) : null}
                        <Input
                          label={values.type === "special_camp" ? "Planned hours per day" : "Planned hours"}
                          name="hours"
                          type="number"
                          inputMode="decimal"
                          min={1}
                          max={24}
                          step="0.5"
                          leading={Clock3}
                          hint="Credited hours come from the actual start and end."
                          value={values.hours}
                          onChange={update}
                          error={errors.hours}
                          required
                        />
                      </div>
                      <Input
                        label="Location"
                        name="location"
                        leading={MapPin}
                        placeholder="e.g. Shanghumugham Beach, Thiruvananthapuram"
                        value={values.location}
                        onChange={update}
                        error={errors.location}
                        required
                      />
                    </>
                  ) : null}

                  {step === 2 ? (
                    <>
                      <UploadZone label="Cover photo" file={image} onChange={setImage} hint="Shown on the event page and in the public album. You can skip this." />
                      {image ? <Input label="Caption" name="caption" placeholder="What does the photo show?" value={values.caption} onChange={update} /> : null}
                    </>
                  ) : null}

                  {step === 3 ? (
                    <>
                      <Preview values={values} image={image} />
                      <p className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-4 text-[14px] leading-relaxed text-fg-2">
                        <Bell aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" />
                        Publishing notifies every teacher and volunteer at your institution.
                      </p>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="outline" icon={ArrowLeft} onClick={() => setStep(step - 1)} disabled={submitting}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" loading={submitting} arrow={step < STEPS.length - 1}>
                {step < STEPS.length - 1 ? "Continue" : submitting ? "Publishing" : "Publish event"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default function CreateEvent() {
  return (
    <Suspense>
      <CreateEventForm />
    </Suspense>
  );
}
