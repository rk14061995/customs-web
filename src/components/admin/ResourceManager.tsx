"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "list";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  helperText?: string;
};

export type ColumnConfig<T> = {
  key: keyof T & string;
  label: string;
  render?: (row: T) => ReactNode;
};

type Row = Record<string, unknown> & { _id: string };

export default function ResourceManager<T extends Row>({
  title,
  description,
  apiPath,
  columns,
  fields,
  defaultValues = {},
}: {
  title: string;
  description?: string;
  apiPath: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  defaultValues?: Record<string, unknown>;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch(apiPath);
    const data = await res.json();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  const openCreate = () => {
    setEditing(null);
    setFormValues({ ...defaultValues });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setFormValues({ ...row });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const url = editing ? `${apiPath}/${editing._id}` : apiPath;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save");
        return;
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: T) => {
    if (!confirm(`Delete this ${title.toLowerCase().replace(/s$/, "")}?`)) return;
    await fetch(`${apiPath}/${row._id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-foreground/60">{description}</p>}
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Add New
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-5 py-3 font-medium text-foreground/60">
                    {col.label}
                  </th>
                ))}
                <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-foreground/50">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-foreground/50">
                    No records yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row._id}>
                    {columns.map((col) => (
                      <td key={col.key} className="max-w-xs truncate px-5 py-3 text-foreground">
                        {col.render ? col.render(row) : String(row[col.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          aria-label="Delete"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {editing ? "Edit" : "Add"} {title.replace(/s$/, "")}
              </h2>
              <button onClick={closeModal} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {field.label}
                    {field.required && <span className="text-orange"> *</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={(formValues[field.name] as string) ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={(formValues[field.name] as string) ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))}
                      className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(formValues[field.name])}
                      onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.checked }))}
                      className="size-4"
                    />
                  ) : field.type === "list" ? (
                    <textarea
                      rows={4}
                      value={
                        Array.isArray(formValues[field.name])
                          ? (formValues[field.name] as string[]).join("\n")
                          : ""
                      }
                      onChange={(e) =>
                        setFormValues((v) => ({
                          ...v,
                          [field.name]: e.target.value.split("\n").filter((line) => line.trim() !== ""),
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                    />
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={(formValues[field.name] as string | number) ?? ""}
                      onChange={(e) =>
                        setFormValues((v) => ({
                          ...v,
                          [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                    />
                  )}
                  {field.helperText && <p className="mt-1 text-xs text-foreground/50">{field.helperText}</p>}
                </div>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
