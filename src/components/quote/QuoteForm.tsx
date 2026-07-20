"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Navigation,
  Scale,
  Ruler,
  Calendar,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Plane,
  Ship,
  Truck,
  Zap,
  Warehouse,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { quoteSchema, type QuoteFormValues } from "@/lib/validation";

const shipmentTypes = [
  { value: "air", label: "Air Freight", icon: Plane },
  { value: "ocean", label: "Ocean Freight", icon: Ship },
  { value: "road", label: "Road Transport", icon: Truck },
  { value: "express", label: "Express Delivery", icon: Zap },
  { value: "warehousing", label: "Warehousing", icon: Warehouse },
] as const;

const steps = ["Contact Info", "Shipment Details", "Review & Submit"];

export default function QuoteForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { shipmentType: "air" },
  });

  const values = watch();

  const stepFields: Record<number, (keyof QuoteFormValues)[]> = {
    0: ["name", "company", "phone", "email"],
    1: ["pickupLocation", "destination", "shipmentType", "weight", "dimensions", "pickupDate"],
  };

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: QuoteFormValues) => {
    setSubmitError("");
    try {
      const res = await fetch("/api/quote", {
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
        <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">
          Quote Request Received
        </h2>
        <p className="mt-2 text-foreground/60">
          Thanks, {values.name.split(" ")[0]}! Our team will reach out within
          24 hours with a customized quote for your shipment.
        </p>
      </Card>
    );
  }

  return (
    <Card hover={false} className="mx-auto max-w-2xl sm:p-8">
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i <= step ? "bg-navy text-white" : "bg-surface text-foreground/40"
              }`}
            >
              {i + 1}
            </div>
            <span className={`hidden text-xs font-medium sm:block ${i <= step ? "text-foreground" : "text-foreground/40"}`}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border-subtle" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Field icon={User} label="Full Name" error={errors.name?.message}>
                <input {...register("name")} placeholder="John Doe" className={inputClass} />
              </Field>
              <Field icon={Building2} label="Company (optional)" error={errors.company?.message}>
                <input {...register("company")} placeholder="Acme Inc." className={inputClass} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field icon={Phone} label="Phone" error={errors.phone?.message}>
                  <input {...register("phone")} placeholder="+1 555 000 0000" className={inputClass} />
                </Field>
                <Field icon={Mail} label="Email" error={errors.email?.message}>
                  <input {...register("email")} type="email" placeholder="you@company.com" className={inputClass} />
                </Field>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
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
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Field icon={MessageSquare} label="Message (optional)" error={errors.message?.message}>
                <textarea {...register("message")} rows={4} placeholder="Additional details about your shipment..." className={inputClass} />
              </Field>

              <div className="rounded-2xl bg-surface p-4 text-sm">
                <p className="font-semibold text-foreground">Review Your Request</p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-foreground/60">
                  <dt>Name</dt><dd className="text-foreground">{values.name}</dd>
                  <dt>Email</dt><dd className="text-foreground">{values.email}</dd>
                  <dt>Route</dt><dd className="text-foreground">{values.pickupLocation} → {values.destination}</dd>
                  <dt>Shipment Type</dt><dd className="capitalize text-foreground">{values.shipmentType}</dd>
                  <dt>Weight</dt><dd className="text-foreground">{values.weight} kg</dd>
                </dl>
              </div>
              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <Button type="button" variant="ghost" icon={ChevronLeft} iconPosition="left" onClick={goBack}>
              Back
            </Button>
          ) : <span />}

          {step < steps.length - 1 ? (
            <Button type="button" icon={ChevronRight} onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} icon={isSubmitting ? undefined : ChevronRight}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Request"}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy";

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
