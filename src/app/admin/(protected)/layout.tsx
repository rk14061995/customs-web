import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <AdminSidebar name={session.name} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
