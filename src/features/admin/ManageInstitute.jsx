"use client";

import { useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import { ConfirmDialog, Drawer } from "@/components/ui/Dialog";
import PageHeader from "@/components/ui/PageHeader";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import InstitutionFields, { EMPTY_INSTITUTION, useInstitutionForm } from "./InstitutionForm";

const count = (value) => (Array.isArray(value) ? value.length : 0);

function InstitutionEditor({ open, onClose, editing, onSaved }) {
  const form = useInstitutionForm(
    editing
      ? {
          name: editing.name || "",
          address: editing.address || "",
          contactEmail: editing.contactEmail || "",
          phoneNumber: editing.phoneNumber || "",
        }
      : EMPTY_INSTITUTION
  );
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    const payload = Object.fromEntries(Object.entries(form.values).map(([k, v]) => [k, v.trim()]));
    try {
      if (editing) await api.put(`/api/institution/${editing._id}`, payload);
      else await api.post("/api/institution/create", payload);
      toast.success(editing ? "Institution updated." : `${payload.name} was added.`);
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save the institution."));
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={editing ? "Edit institution" : "New institution"}
      title={editing ? editing.name : "Add an institution"}
      description={editing ? "Changes apply everywhere this institution appears." : "Register a college so its people can join Synapsis."}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="institution-form" loading={saving}>
            {editing ? "Save changes" : "Add institution"}
          </Button>
        </>
      }
    >
      <form id="institution-form" onSubmit={save} noValidate>
        <InstitutionFields form={form} />
      </form>
    </Drawer>
  );
}

export default function ManageInstitute() {
  const list = useResource(() => getList("/api/institution/allinstitutebyadmin", "institutions"), []);
  const [editor, setEditor] = useState({ open: false, editing: null, key: 0 });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openEditor = (editing = null) => setEditor((prev) => ({ open: true, editing, key: prev.key + 1 }));
  const closeEditor = () => setEditor((prev) => ({ ...prev, open: false }));

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/institution/${deleting._id}`);
      list.mutate((rows) => (rows || []).filter((row) => row._id !== deleting._id));
      toast.success(`${deleting.name} was deleted.`);
      setDeleting(null);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't delete that institution."));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Institution",
      sortable: true,
      primary: true,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-fg-2">
            <Building2 aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-fg">{row.name}</p>
            <p className="truncate text-[12.5px] text-muted">{row.address || "No address"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <div className="min-w-0 text-[13px]">
          <p className="truncate">{row.contactEmail || "—"}</p>
          <p className="truncate text-muted">{row.phoneNumber || ""}</p>
        </div>
      ),
    },
    { key: "students", header: "Students", align: "right", sortable: true, sortValue: (row) => count(row.students), render: (row) => <span className="tabular">{formatNumber(count(row.students))}</span> },
    { key: "teacher", header: "Teachers", align: "right", sortable: true, sortValue: (row) => count(row.teacher), render: (row) => <span className="tabular">{formatNumber(count(row.teacher))}</span> },
    {
      key: "coordinators",
      header: "Coordinators",
      align: "right",
      sortable: true,
      sortValue: (row) => count(row.coordinators),
      render: (row) => <span className="tabular">{formatNumber(count(row.coordinators))}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Institutions"
        title="Institutions"
        description="The colleges on Synapsis. People choose their institution when they sign up, and coordinators only see their own."
        actions={
          <Button icon={Plus} onClick={() => openEditor()}>
            Add institution
          </Button>
        }
      />
      <DataTable
        caption="Institutions"
        columns={columns}
        rows={list.data || []}
        loading={list.loading}
        error={list.status === "error" ? list.error : null}
        onRetry={list.reload}
        searchKeys={["name", "address", "contactEmail"]}
        searchPlaceholder="Search institutions"
        initialSort={{ key: "name", dir: "asc" }}
        noun="institutions"
        rowActions={(row) => (
          <>
            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEditor(row)} aria-label={`Edit ${row.name}`}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleting(row)} aria-label={`Delete ${row.name}`} className="hover:bg-red-50 hover:text-red-700">
              Delete
            </Button>
          </>
        )}
        empty={{
          icon: Building2,
          title: "No institutions yet",
          description: "Add the first college so its students, teachers and coordinators can sign up.",
          action: (
            <Button size="sm" icon={Plus} onClick={() => openEditor()}>
              Add institution
            </Button>
          ),
        }}
      />

      <InstitutionEditor
        key={editor.key}
        open={editor.open}
        editing={editor.editing}
        onClose={closeEditor}
        onSaved={() => {
          closeEditor();
          list.reload();
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.name || "this institution"}?`}
        confirmLabel="Delete institution"
        description="It will disappear from the sign-up list immediately. This can't be undone."
      />
    </>
  );
}
