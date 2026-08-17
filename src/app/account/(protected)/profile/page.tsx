"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Building2, Phone, MapPin, Landmark, Lock, Save, Loader2, KeyRound } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  customerProfileSchema,
  customerPasswordChangeSchema,
  type CustomerProfileFormValues,
  type CustomerPasswordChangeFormValues,
} from "@/lib/validation";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy";

export default function AccountProfilePage() {
  const [email, setEmail] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const profileForm = useForm<CustomerProfileFormValues>({ resolver: zodResolver(customerProfileSchema) });
  const passwordForm = useForm<CustomerPasswordChangeFormValues>({
    resolver: zodResolver(customerPasswordChangeSchema),
  });

  useEffect(() => {
    fetch("/api/account/profile")
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.email);
        profileForm.reset({
          name: data.name,
          company: data.company ?? "",
          phone: data.phone,
          address: data.address ?? "",
          gstNumber: data.gstNumber ?? "",
          stateName: data.stateName ?? "",
          stateCode: data.stateCode ?? "",
        });
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaveProfile = async (data: CustomerProfileFormValues) => {
    setProfileMessage("");
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setProfileMessage(res.ok ? "Profile updated." : "Could not save your changes.");
  };

  const onChangePassword = async (data: CustomerPasswordChangeFormValues) => {
    setPasswordMessage("");
    const res = await fetch("/api/account/profile/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setPasswordMessage("Password updated.");
      passwordForm.reset();
    } else {
      const body = await res.json().catch(() => ({}));
      setPasswordMessage(typeof body.error === "string" ? body.error : "Could not change your password.");
    }
  };

  if (!loaded) return <p className="text-sm text-foreground/60">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-foreground/60">Update your contact details and password.</p>
      </div>

      <Card hover={false} className="max-w-2xl">
        <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Account Details</h2>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              Email (login)
            </label>
            <input value={email} disabled className={`${inputClass} opacity-60`} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={User} label="Full Name" error={profileForm.formState.errors.name?.message}>
              <input {...profileForm.register("name")} className={inputClass} />
            </Field>
            <Field icon={Building2} label="Company" error={profileForm.formState.errors.company?.message}>
              <input {...profileForm.register("company")} className={inputClass} />
            </Field>
          </div>
          <Field icon={Phone} label="Phone" error={profileForm.formState.errors.phone?.message}>
            <input {...profileForm.register("phone")} className={inputClass} />
          </Field>
          <Field icon={MapPin} label="Address" error={profileForm.formState.errors.address?.message}>
            <textarea {...profileForm.register("address")} rows={2} className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field icon={Landmark} label="GST Number" error={profileForm.formState.errors.gstNumber?.message}>
              <input {...profileForm.register("gstNumber")} className={inputClass} />
            </Field>
            <Field icon={Landmark} label="State" error={profileForm.formState.errors.stateName?.message}>
              <input {...profileForm.register("stateName")} className={inputClass} />
            </Field>
            <Field icon={Landmark} label="State Code" error={profileForm.formState.errors.stateCode?.message}>
              <input {...profileForm.register("stateCode")} className={inputClass} />
            </Field>
          </div>
          {profileMessage && <p className="text-sm text-foreground/70">{profileMessage}</p>}
          <Button type="submit" disabled={profileForm.formState.isSubmitting} icon={Save} size="sm">
            Save Changes
          </Button>
        </form>
      </Card>

      <Card hover={false} className="max-w-2xl">
        <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Change Password</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
          <Field icon={Lock} label="Current Password" error={passwordForm.formState.errors.currentPassword?.message}>
            <input type="password" {...passwordForm.register("currentPassword")} className={inputClass} />
          </Field>
          <Field icon={KeyRound} label="New Password" error={passwordForm.formState.errors.newPassword?.message}>
            <input type="password" {...passwordForm.register("newPassword")} className={inputClass} />
          </Field>
          {passwordMessage && <p className="text-sm text-foreground/70">{passwordMessage}</p>}
          <Button type="submit" disabled={passwordForm.formState.isSubmitting} icon={KeyRound} size="sm" variant="secondary">
            {passwordForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Update Password"}
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
