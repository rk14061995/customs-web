import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import AccountSignupForm from "@/components/account/SignupForm";
import { getCustomerSession } from "@/lib/customerAuth";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function AccountSignupPage() {
  const session = await getCustomerSession();
  if (session) redirect("/account");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-background p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-navy text-white">
            <Truck className="size-6" />
          </span>
          <h1 className="mt-4 font-heading text-xl font-bold text-foreground">Create Your Account</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Track shipments, pay invoices, and manage your wallet in one place
          </p>
        </div>
        <AccountSignupForm />
      </div>
    </div>
  );
}
