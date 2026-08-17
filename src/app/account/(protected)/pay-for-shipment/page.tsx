"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapPin,
  Navigation,
  Scale,
  Ruler,
  Calendar,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Plane,
  Ship,
  Truck,
  Zap,
  Warehouse,
  CreditCard,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { bookingRequestSchema, type BookingRequestFormValues } from "@/lib/validation";

const shipmentTypes = [
  { value: "air", label: "Air Freight", icon: Plane },
  { value: "ocean", label: "Ocean Freight", icon: Ship },
  { value: "road", label: "Road Transport", icon: Truck },
  { value: "express", label: "Express Delivery", icon: Zap },
  { value: "warehousing", label: "Warehousing", icon: Warehouse },
] as const;

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy";

export default function AccountPayForShipmentPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingRequestFormValues>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: { shipmentType: "air" },
  });
  const values = watch();

  const onSubmit = async (data: BookingRequestFormValues) => {
    setSubmitError("");
    try {
      const res = await fetch("/api/account/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong submitting your request. Please try again.");
    }
  };

  if (submitted) {
    return (
      <Card hover={false} className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto size-14 text-orange" />
        <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">Shipment Request Sent</h2>
        <p className="mt-2 text-foreground/60">
          Our team will review your shipment and price it shortly. Once priced, you&apos;ll be able to pay
          instantly from your wallet under &quot;My Requests&quot;.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => router.push("/account/requests")}>View My Requests</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Pay for Shipment</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Tell us about your shipment — we&apos;ll price it and you can pay instantly from your wallet.
        </p>
      </div>

      <Card hover={false} className="mx-auto max-w-2xl sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={MapPin} label="Pickup Location" error={errors.pickupLocation?.message}>
              <input {...register("pickupLocation")} placeholder="City, Country" className={inputClass} />
            </Field>
            <Field icon={Navigation} label="Destination" error={errors.destination?.message}>
              <input {...register("destination")} placeholder="City, Country" className={inputClass} />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Shipment Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {shipmentTypes.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => setValue("shipmentType", type.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors ${
                    values.shipmentType === type.value
                      ? "border-navy bg-navy/5 text-navy dark:bg-white/10 dark:text-white"
                      : "border-border-subtle text-foreground/60 hover:border-navy/40"
                  }`}
                >
                  <type.icon className="size-5" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={Scale} label="Weight (kg)" error={errors.weight?.message}>
              <input {...register("weight")} placeholder="e.g. 250" className={inputClass} />
            </Field>
            <Field icon={Ruler} label="Dimensions (optional)" error={errors.dimensions?.message}>
              <input {...register("dimensions")} placeholder="L x W x H cm" className={inputClass} />
            </Field>
          </div>

          <Field icon={Calendar} label="Expected Pickup Date" error={errors.pickupDate?.message}>
            <input {...register("pickupDate")} type="date" className={inputClass} />
          </Field>

          <Field icon={MessageSquare} label="Message (optional)" error={errors.message?.message}>
            <textarea {...register("message")} rows={4} placeholder="Additional details about your shipment..." className={inputClass} />
          </Field>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <Button type="submit" disabled={isSubmitting} icon={isSubmitting ? undefined : CreditCard} className="w-full">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Shipment Request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Icon className="size-3.5 text-foreground/50" />
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
