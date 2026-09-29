"use client";

import { useMemo, useState } from "react";
import { Award, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import { Select, Textarea } from "@/components/ui/Field";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage, getList } from "@/lib/api";
import useResource from "@/hooks/useResource";

const MAX_MARKS = 100;

export default function RecommendGraceMark() {
  const students = useResource(() => getList("/api/coordinator/students", "students"), []);
  const [studentId, setStudentId] = useState("");
  const [marks, setMarks] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  const volunteers = useMemo(() => (students.data || []).filter((s) => s.role === "volunteer"), [students.data]);
  const q = query.trim().toLowerCase();
  const options = q ? volunteers.filter((s) => `${s.name} ${s.department}`.toLowerCase().includes(q)) : volunteers;
  const selected = volunteers.find((s) => s._id === studentId);
  const pending = selected?.pendingGraceRecommendation?.status === "pending";

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!studentId) next.studentId = "Choose a volunteer.";
    const value = Number(marks);
    if (!marks || !Number.isFinite(value) || value <= 0 || value > MAX_MARKS) next.marks = `Enter marks between 1 and ${MAX_MARKS}.`;
    if (reason.trim().length < 10) next.reason = "Explain why, in at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await api.post("/api/coordinator/recommendgracemark", { studentId, marks: value, reason: reason.trim() });
      students.mutate((list) =>
        (list || []).map((s) => (s._id === studentId ? { ...s, pendingGraceRecommendation: { status: "pending", marks: value, reason: reason.trim() } } : s))
      );
      toast.success(`Grace mark recommendation sent for ${selected.name}.`);
      setStudentId("");
      setMarks("");
      setReason("");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't send that recommendation."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Recognition"
        title="Recommend a grace mark"
        description="Suggest grace marks for a volunteer's service. A teacher at your institution reviews and approves it before it counts."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="New recommendation">
          {students.loading ? (
            <div className="space-y-5">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : students.status === "error" ? (
            <ErrorState size="sm" error={students.error} onRetry={students.reload} />
          ) : volunteers.length ? (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div>
                <SearchInput value={query} onChange={setQuery} placeholder="Search volunteers" className="mb-2" />
                <Select label="Volunteer" value={studentId} onChange={(e) => setStudentId(e.target.value)} error={errors.studentId} placeholder="Choose a volunteer" required>
                  {options.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.department}
                    </option>
                  ))}
                </Select>
              </div>
              {pending ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">
                  {selected.name} already has a recommendation awaiting teacher review. Wait for it to be resolved before sending another.
                </p>
              ) : null}
              <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
                <div>
                  <label htmlFor="gm-marks" className="text-[13px] font-semibold text-fg">
                    Marks
                  </label>
                  <input
                    id="gm-marks"
                    type="number"
                    min={1}
                    max={MAX_MARKS}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    aria-invalid={errors.marks ? true : undefined}
                    className="tabular mt-1.5 h-11 w-full rounded-lg border border-line bg-paper px-3.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand/15"
                  />
                  {errors.marks ? <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.marks}</p> : null}
                </div>
                <Textarea label="Reason" rows={3} placeholder="What did they do to earn this?" value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} required />
              </div>
              <Button type="submit" icon={Send} loading={submitting} disabled={pending}>
                Send recommendation
              </Button>
            </form>
          ) : (
            <EmptyState size="sm" icon={Award} title="No volunteers yet" description="Grace marks can be recommended once students become NSS volunteers." />
          )}
        </Panel>

        <Panel title="How approval works" bodyClassName="space-y-4">
          {[
            ["1", "You recommend", "Marks and a reason, for one volunteer at a time."],
            ["2", "A teacher reviews", "Any teacher at your institution can approve or reject it."],
            ["3", "It's recorded", "Approved marks join the volunteer's grace history."],
          ].map(([n, title, text]) => (
            <div key={n} className="flex gap-3">
              <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">{n}</span>
              <div>
                <p className="text-[14px] font-semibold text-fg">{title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          ))}
          <p className="flex items-start gap-2 rounded-lg border border-line bg-canvas p-3 text-[12.5px] leading-relaxed text-muted">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-brand-700" />
            Only one recommendation can be pending per volunteer at a time.
          </p>
        </Panel>
      </div>
    </>
  );
}
