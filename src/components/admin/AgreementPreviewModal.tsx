"use client";

import { useEffect, useState } from "react";
import { Loader2, X, FileDown, Link as LinkIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

type AgreementDetail = {
  status: "pending" | "signed" | "expired";
  shipment: { _id: string; trackingNumber: string; origin: string; destination: string } | null;
  customer: { name: string; company?: string; email: string } | null;
  template: {
    title: string;
    forwarderName: string;
    forwarderAddress: string;
    subject: string;
    clauses: string[];
    authorizedSignatoryName: string;
    authorizedSignatoryDesignation: string;
  };
  signature?: { signedName: string; signedAt: string };
};

export default function AgreementPreviewModal({
  shipmentId,
  onClose,
}: {
  shipmentId: string;
  onClose: () => void;
}) {
  const [agreement, setAgreement] = useState<AgreementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/agreements/${shipmentId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to load agreement");
          return;
        }
        setAgreement(data);
      })
      .catch(() => setError("Failed to load agreement"))
      .finally(() => setLoading(false));
  }, [shipmentId]);

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      const res = await fetch(`/api/admin/agreements/${shipmentId}/link`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to generate agreement link");
        return;
      }
      await navigator.clipboard.writeText(data.link);
      alert("Signing link copied to clipboard.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Agreement Preview</h2>
          <button onClick={onClose} aria-label="Close" className="text-foreground/50 hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <Loader2 className="mx-auto size-6 animate-spin text-foreground/40" />
          ) : error || !agreement ? (
            <p className="text-center text-sm text-red-500">{error || "Agreement not found"}</p>
          ) : (
            <div className="rounded-xl border border-border-subtle p-6">
              <h1 className="text-center font-heading text-base font-bold uppercase text-foreground">
                {agreement.template.title}
              </h1>
              <p className="mt-1 text-center text-sm font-semibold uppercase text-foreground/60">
                {agreement.template.forwarderName}
              </p>

              <div className="mt-5 space-y-1 text-sm text-foreground/70">
                <p>
                  <span className="font-medium text-foreground">{agreement.template.forwarderName}</span> —{" "}
                  {agreement.template.forwarderAddress || "(no address set)"}
                </p>
                <p>
                  Customer: <span className="font-medium text-foreground">{agreement.customer?.name ?? "—"}</span>
                </p>
                {agreement.shipment && (
                  <p>
                    Shipment:{" "}
                    <span className="font-medium text-foreground">{agreement.shipment.trackingNumber}</span> ·{" "}
                    {agreement.shipment.origin} → {agreement.shipment.destination}
                  </p>
                )}
              </div>

              <p className="mt-5 text-sm font-semibold text-foreground">Subject: {agreement.template.subject}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/70">
                {agreement.template.clauses.map((clause, i) => (
                  <li key={i}>{clause}</li>
                ))}
              </ol>

              <div className="mt-6 border-t border-border-subtle pt-4 text-sm text-foreground/70">
                {agreement.status === "signed" && agreement.signature ? (
                  <p className="font-medium text-green-600 dark:text-green-400">
                    Signed by {agreement.signature.signedName} on {formatDate(agreement.signature.signedAt)}
                  </p>
                ) : (
                  <p>Not yet signed by the customer.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {!loading && agreement && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
            <Button variant="ghost" onClick={handleCopyLink} disabled={copying} icon={LinkIcon}>
              {copying ? "Copying..." : "Copy Signing Link"}
            </Button>
            <a
              href={`/api/admin/agreements/${shipmentId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-dark hover:shadow-orange/40"
            >
              <FileDown className="size-4" />
              Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
