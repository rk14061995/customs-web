import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import AccountLoginForm from "@/components/account/LoginForm";
import { getCustomerSession } from "@/lib/customerAuth";

export const metadata: Metadata = {
  title: "Customer Login",
};

export default async function AccountLoginPage() {
  const session = await getCustomerSession();
  if (session) redirect("/account");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-background p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-navy text-white">
            <Truck className="size-6" />
          </span>
          <h1 className="mt-4 font-heading text-xl font-bold text-foreground">My Account</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Sign in to view your orders, invoices, and wallet
          </p>
        </div>
        <AccountLoginForm />
      </div>
    </div>
  );
}
