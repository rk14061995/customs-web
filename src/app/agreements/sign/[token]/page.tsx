"use client";

import { use, useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SignaturePad, { type SignaturePadHandle } from "@/components/agreements/SignaturePad";
import { formatDateTime } from "@/lib/utils";
import ClauseHtml from "@/components/agreements/ClauseHtml";

type AgreementData = {
  status: "pending" | "signed" | "expired";
  shipment: { trackingNumber: string; origin: string; destination: string } | null;
  customer: { name: string } | null;
  template: {
    title: string;
    forwarderName: string;
    forwarderAddress: string;
    subject: string;
    clauses: string[];
  };
  signature?: { signedName: string; signedAt: string };
};

export default function AgreementSignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [agreement, setAgreement] = useState<AgreementData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const padRef = useRef<SignaturePadHandle>(null);
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    fetch(`/api/agreements/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? "This agreement could not be found.");
          return;
        }
        setAgreement(data);
        if (data.customer?.name) setSignedName(data.customer.name);
      })
      .catch(() => setLoadError("This agreement could not be found."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setSubmitError("");
    const signatureDataUrl = padRef.current?.getDataUrl();
    if (!signedName.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (!signatureDataUrl) {
      setSubmitError("Please draw your signature.");
      return;
    }
    if (!agreed) {
      setSubmitError("Please confirm you have read and agree to the terms.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/agreements/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedName: signedName.trim(), signatureDataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to submit signature.");
        return;
      }
      setAgreement((a) => (a ? { ...a, status: "signed", signature: { signedName: signedName.trim(), signedAt: new Date().toISOString() } } : a));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground/40" />
      </Container>
    );
  }

  if (loadError || !agreement) {
    return (
      <Container className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto size-10 text-foreground/30" />
          <p className="mt-4 text-foreground/70">{loadError || "This agreement could not be found."}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-12">
      <div className="rounded-2xl border border-border-subtle bg-background p-6 sm:p-8">
        <h1 className="text-center font-heading text-lg font-bold uppercase text-foreground">
          {agreement.template.title}
        </h1>
        <p className="mt-1 text-center text-sm font-semibold uppercase text-foreground/60">
          {agreement.template.forwarderName}
        </p>

        <div className="mt-6 space-y-1 text-sm text-foreground/70">
          <p>
            <span className="font-medium text-foreground">{agreement.template.forwarderName}</span> —{" "}
            {agreement.template.forwarderAddress}
          </p>
          <p>
            Customer: <span className="font-medium text-foreground">{agreement.customer?.name}</span>
          </p>
          {agreement.shipment && (
            <p>
              Shipment: <span className="font-medium text-foreground">{agreement.shipment.trackingNumber}</span> ·{" "}
              {agreement.shipment.origin} → {agreement.shipment.destination}
            </p>
          )}
        </div>

        <p className="mt-6 text-sm font-semibold text-foreground">Subject: {agreement.template.subject}</p>
        <p className="mt-3 text-sm text-foreground/70">
          I the undersigned customer, hereby declare and agree as follows:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/70">
          {agreement.template.clauses.map((clause, i) => (
            <li key={i}><ClauseHtml text={clause} /></li>
          ))}
        </ol>

        {agreement.status === "signed" ? (
          <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
            <CheckCircle2 className="mx-auto size-8 text-green-600 dark:text-green-400" />
            <p className="mt-2 font-medium text-foreground">
              Signed by {agreement.signature?.signedName ?? signedName}
              {agreement.signature?.signedAt ? ` on ${formatDateTime(agreement.signature.signedAt)}` : ""}
            </p>
            <a
              href={`/api/agreements/${token}/pdf${timeZone ? `?tz=${encodeURIComponent(timeZone)}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
            >
              <FileText className="size-4" /> View / Download PDF
            </a>
          </div>
        ) : agreement.status === "expired" ? (
          <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5 text-center text-sm text-foreground/60">
            This signing link has expired. Please contact us for a new one.
          </div>
        ) : (
          <div className="mt-8 space-y-4 border-t border-border-subtle pt-6">
            <p className="text-sm text-foreground/70">
              I have read, understood, and voluntarily accepted the above terms and conditions.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
              <input
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Signature</label>
              <SignaturePad ref={padRef} />
            </div>

            <label className="flex items-start gap-2 text-sm text-foreground/70">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              I have read and agree to the above terms and conditions.
            </label>

            {submitError && <p className="text-sm text-red-500">{submitError}</p>}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Sign Agreement"}
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}
