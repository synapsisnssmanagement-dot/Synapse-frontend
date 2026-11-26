"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";

// Small editable table: fields = [{ key, label, type?, options?, width? }].
export default function RowsEditor({ rows: initial = [], fields, onSave, saving, disabled, addLabel = "Add row", caption }) {
  const [rows, setRows] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setRows(initial);
  }
  const blank = Object.fromEntries(fields.map((f) => [f.key, f.options ? f.options[0] : ""]));
  const set = (i, k, v) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-[13px]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="text-left text-muted">
              {fields.map((f) => (
                <th key={f.key} scope="col" className="px-1 py-1 font-medium">
                  {f.label}
                </th>
              ))}
              <th scope="col" className="sr-only">
                Remove
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {fields.map((f) => (
                  <td key={f.key} className="px-1 py-1">
                    {f.options ? (
                      <select aria-label={`${f.label} row ${i + 1}`} className="h-9 w-full rounded-md border border-line bg-paper px-2" value={r[f.key] ?? ""} disabled={disabled} onChange={(e) => set(i, f.key, e.target.value)}>
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input aria-label={`${f.label} row ${i + 1}`} className="h-9 w-full rounded-md border border-line bg-paper px-2" type={f.type || "text"} value={r[f.key] ?? ""} disabled={disabled} onChange={(e) => set(i, f.key, e.target.value)} />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  <IconButton label={`Remove row ${i + 1}`} icon={Trash2} size="sm" disabled={disabled} onClick={() => setRows((x) => x.filter((_, j) => j !== i))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <p className="py-2 text-[13px] text-muted">No rows yet.</p> : null}
      {!disabled ? (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="ghost" icon={Plus} onClick={() => setRows((r) => [...r, blank])}>
            {addLabel}
          </Button>
          <Button size="sm" variant="dark" loading={saving} onClick={() => onSave(rows)}>
            Save
          </Button>
        </div>
      ) : null}
    </div>
  );
}
