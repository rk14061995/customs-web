"use client";

import { useEffect, useState } from "react";
import { Receipt, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Quotation = {
  _id: string;
  quoteNumber: string;
  origin: string;
  destination: string;
  serviceType: string;
  total: number;
  currency: string;
  status: string;
  validUntil?: string;
  createdAt: string;
};

const statusColor: Record<string, string> = {
  accepted: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-500",
  expired: "bg-foreground/10 text-foreground/50",
  sent: "bg-orange/10 text-orange",
  draft: "bg-navy/10 text-navy dark:text-white",
};

export default function AccountQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[] | null>(null);

  useEffect(() => {
    fetch("/api/account/quotations")
      .then((res) => res.json())
      .then(setQuotations);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Quotations</h1>
        <p className="mt-1 text-sm text-foreground/60">Pricing our team has sent you.</p>
      </div>

      {quotations === null ? (
        <p className="text-sm text-foreground/60">Loading…</p>
      ) : quotations.length === 0 ? (
        <Card hover={false} className="text-center text-sm text-foreground/60">
          <Receipt className="mx-auto mb-3 size-8 text-foreground/30" />
          No quotations yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => (
            <Card key={q._id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-heading font-semibold text-foreground">{q.quoteNumber}</p>
                <p className="text-sm text-foreground/60">
                  {q.origin} → {q.destination} · {q.serviceType}
                </p>
                <p className="text-xs text-foreground/40">
                  {formatDate(q.createdAt)}
                  {q.validUntil ? ` · Valid until ${q.validUntil}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[q.status] ?? "bg-navy/10 text-navy dark:text-white"}`}>
                  {q.status}
                </span>
                <p className="font-heading font-bold text-foreground">{formatCurrency(q.total, q.currency)}</p>
                <a
                  href={`/api/account/quotations/${q._id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Download className="size-4" /> PDF
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
