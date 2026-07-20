import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin | Rana Forwarder",
    template: "%s | Rana Forwarder Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-surface text-foreground">{children}</div>;
}
