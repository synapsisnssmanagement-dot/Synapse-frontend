"use client";

import { useMemo, useState } from "react";
import { Download, GraduationCap, HeartHandshake, Search, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Field";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatNumber } from "@/lib/format";

function SkillSearch({ onResults }) {
  const [skill, setSkill] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (event) => {
    event.preventDefault();
    const term = skill.trim();
    if (!term) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/coordinator/getstudentbyskill/${encodeURIComponent(term)}`, {});
      const students = res.data?.students || [];
      onResults(term, students);
      if (!students.length) toast.info(`No students list "${term}" among their talents.`);
    } catch (error) {
      onResults(term, null);
      toast.error(errorMessage(error, "No students found with that skill."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={search} className="flex items-end gap-2">
      <Input label="Find by talent" leading={Search} placeholder="e.g. photography, first aid" value={skill} onChange={(e) => setSkill(e.target.value)} containerClassName="w-64" />
      <Button type="submit" variant="outline" loading={loading}>
        Search
      </Button>
    </form>
  );
}

export default function ManageStudents() {
  const list = useResource(() => getList("/api/coordinator/students", "students"), []);
  const [skillFilter, setSkillFilter] = useState(null);
  const [busy, setBusy] = useState(null);

  const rows = useMemo(() => {
    if (!skillFilter) return list.data || [];
    return skillFilter.students || [];
  }, [list.data, skillFilter]);

  const convert = async (student, toVolunteer) => {
    const endpoint = toVolunteer ? "/api/coordinator/studenttovolunteer" : "/api/coordinator/volunteertostudent";
    setBusy(student._id);
    try {
      await api.post(endpoint, { studentId: student._id });
      const nextRole = toVolunteer ? "volunteer" : "student";
      const patch = (rows2) => (rows2 || []).map((s) => (s._id === student._id ? { ...s, role: nextRole } : s));
      list.mutate(patch);
      if (skillFilter) setSkillFilter((prev) => ({ ...prev, students: patch(prev.students) }));
      toast.success(toVolunteer ? `${student.name} is now an NSS volunteer.` : `${student.name} is now a regular student.`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't update that student."));
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () => {
    downloadCsv("students.csv", [
      ["name", "email", "department", "talents", "role"],
      ...rows.map((s) => [s.name, s.email || "", s.department || "", Array.isArray(s.talents) ? s.talents.join("; ") : s.talents || "", s.role || "student"]),
    ]);
  };

  const columns = [
    { key: "name", header: "Name", sortable: true, primary: true, render: (row) => <Identity name={row.name} email={row.email} /> },
    { key: "department", header: "Department", sortable: true, render: (row) => row.department || "—" },
    { key: "talents", header: "Talents", render: (row) => (Array.isArray(row.talents) ? row.talents.join(", ") : row.talents) || "—" },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => (row.role === "volunteer" ? <StatusBadge status="active" label="Volunteer" /> : <StatusBadge status="pending" label="Student" />),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Students"
        description="Every student at your institution. Make someone an NSS volunteer to include them in events, hours and levels."
        meta={list.data ? <span>{formatNumber(list.data.length)} students</span> : null}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <SkillSearch onResults={(term, students) => setSkillFilter(students ? { term, students } : { term, students: [] })} />
            <Button variant="outline" icon={Download} onClick={exportCsv} disabled={!rows.length}>
              Export CSV
            </Button>
          </div>
        }
      />

      {skillFilter ? (
        <p className="mb-4 flex items-center gap-2 text-[13.5px] text-fg-2">
          <Sparkles aria-hidden="true" className="size-4 text-brand-700" />
          Showing {formatNumber(rows.length)} {rows.length === 1 ? "result" : "results"} for &ldquo;{skillFilter.term}&rdquo;
          <button type="button" onClick={() => setSkillFilter(null)} className="link-draw font-semibold text-ink">
            Clear
          </button>
        </p>
      ) : null}

      <DataTable
        caption="Students"
        columns={columns}
        rows={rows}
        loading={list.loading && !skillFilter}
        error={list.status === "error" ? list.error : null}
        onRetry={list.reload}
        searchKeys={skillFilter ? undefined : ["name", "email", "department"]}
        searchPlaceholder="Search students"
        initialSort={{ key: "name", dir: "asc" }}
        noun="students"
        rowActions={(row) => (
          <Button
            size="sm"
            variant="outline"
            icon={row.role === "volunteer" ? Undo2 : HeartHandshake}
            loading={busy === row._id}
            onClick={() => convert(row, row.role !== "volunteer")}
          >
            {row.role === "volunteer" ? "Make student" : "Make volunteer"}
          </Button>
        )}
        empty={{
          icon: GraduationCap,
          title: skillFilter ? "No students match that talent" : "No students yet",
          description: skillFilter ? "Try a broader term, or clear the search." : "Students appear here once an administrator approves their accounts.",
        }}
      />
    </>
  );
}
