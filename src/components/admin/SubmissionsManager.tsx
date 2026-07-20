"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, Eye, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown> & { _id: string; createdAt: string; status: string };

export default function SubmissionsManager({
  title,
  description,
  apiPath,
  statusOptions,
  previewColumns,
  detailFields,
}: {
  title: string;
  description?: string;
  apiPath: string;
  statusOptions: string[];
  previewColumns: { key: string; label: string }[];
  detailFields: { key: string; label: string }[];
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Row | null>(null);

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

  const updateStatus = async (row: Row, status: string) => {
    await fetch(`${apiPath}/${row._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleDelete = async (row: Row) => {
    if (!confirm("Delete this submission?")) return;
    await fetch(`${apiPath}/${row._id}`, { method: "DELETE" });
    load();
  };

  const statusColor: Record<string, string> = {
    new: "bg-orange/10 text-orange",
    contacted: "bg-navy/10 text-navy dark:text-white",
    quoted: "bg-navy/10 text-navy dark:text-white",
    responded: "bg-navy/10 text-navy dark:text-white",
    closed: "bg-foreground/10 text-foreground/60",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-foreground/60">{description}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface">
              <tr>
                {previewColumns.map((col) => (
                  <th key={col.key} className="px-5 py-3 font-medium text-foreground/60">{col.label}</th>
                ))}
                <th className="px-5 py-3 font-medium text-foreground/60">Date</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Status</th>
                <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={previewColumns.length + 3} className="px-5 py-10 text-center text-foreground/50">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={previewColumns.length + 3} className="px-5 py-10 text-center text-foreground/50">
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row._id}>
                    {previewColumns.map((col) => (
                      <td key={col.key} className="max-w-[200px] truncate px-5 py-3 text-foreground">
                        {String(row[col.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-foreground/60">{formatDate(row.createdAt)}</td>
                    <td className="px-5 py-3">
                      <select
                        value={row.status}
                        onChange={(e) => updateStatus(row, e.target.value)}
                        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none ${statusColor[row.status] ?? "bg-foreground/10"}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewing(row)}
                          aria-label="View"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                        >
                          <Eye className="size-4" />
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

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Submission Details</h2>
              <button onClick={() => setViewing(null)} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <dl className="space-y-3">
              {detailFields.map((f) => (
                <div key={f.key}>
                  <dt className="text-xs uppercase tracking-wide text-foreground/50">{f.label}</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{String(viewing[f.key] ?? "—")}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs uppercase tracking-wide text-foreground/50">Submitted</dt>
                <dd className="mt-0.5 text-sm text-foreground">{formatDate(viewing.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
