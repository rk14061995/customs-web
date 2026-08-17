"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Building2, Mail, Phone, Lock, Loader2, UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import { customerSignupSchema, type CustomerSignupFormValues } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy";

export default function AccountSignupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerSignupFormValues>({ resolver: zodResolver(customerSignupSchema) });

  const onSubmit = async (data: CustomerSignupFormValues) => {
    setSubmitError("");
    try {
      const res = await fetch("/api/account/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(typeof body.error === "string" ? body.error : "Could not create your account.");
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field icon={User} label="Full Name" error={errors.name?.message}>
        <input {...register("name")} placeholder="John Doe" className={inputClass} />
      </Field>
      <Field icon={Building2} label="Company (optional)" error={errors.company?.message}>
        <input {...register("company")} placeholder="Acme Inc." className={inputClass} />
      </Field>
      <Field icon={Mail} label="Email" error={errors.email?.message}>
        <input {...register("email")} type="email" placeholder="you@company.com" className={inputClass} />
      </Field>
      <Field icon={Phone} label="Phone" error={errors.phone?.message}>
        <input {...register("phone")} placeholder="+91 98765 43210" className={inputClass} />
      </Field>
      <Field icon={Lock} label="Password" error={errors.password?.message}>
        <input {...register("password")} type="password" placeholder="At least 8 characters" className={inputClass} />
      </Field>
      {submitError && <p className="text-sm text-red-500">{submitError}</p>}
      <Button type="submit" disabled={isSubmitting} icon={isSubmitting ? undefined : UserPlus} className="w-full">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
      </Button>
      <p className="text-center text-sm text-foreground/60">
        Already have an account?{" "}
        <Link href="/account/login" className="font-semibold text-navy dark:text-white">
          Sign in
        </Link>
      </p>
    </form>
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
