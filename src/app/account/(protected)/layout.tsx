import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customerAuth";
import AccountSidebar from "@/components/account/AccountSidebar";

export default async function ProtectedAccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");

  return (
    <div className="min-h-screen bg-surface">
      <AccountSidebar name={session.name} />
      <div className="lg:pl-64 print:pl-0">
        <main className="mx-auto max-w-6xl p-6 lg:p-10 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
