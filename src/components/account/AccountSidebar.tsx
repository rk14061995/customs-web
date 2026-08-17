"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  FileText,
  Wallet,
  CreditCard,
  ClipboardList,
  UserCog,
  LogOut,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/account", icon: LayoutDashboard },
  { label: "My Orders", href: "/account/orders", icon: Package },
  { label: "Quotations", href: "/account/quotations", icon: Receipt },
  { label: "Bills", href: "/account/bills", icon: FileText },
  { label: "Wallet", href: "/account/wallet", icon: Wallet },
  { label: "Pay for Shipment", href: "/account/pay-for-shipment", icon: CreditCard },
  { label: "My Requests", href: "/account/requests", icon: ClipboardList },
  { label: "Profile", href: "/account/profile", icon: UserCog },
];

export default function AccountSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/account/auth/logout", { method: "POST" });
    router.push("/account/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-subtle bg-background lg:flex print:hidden">
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-6 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-navy text-white">
          <Truck className="size-4.5" />
        </span>
        <div>
          <p className="font-heading text-sm font-bold text-foreground">Rana Forwarder</p>
          <p className="text-xs text-foreground/50">My Account</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-navy text-white" : "text-foreground/70 hover:bg-navy/5 dark:hover:bg-white/5"
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <div className="mb-2 px-3 text-xs text-foreground/50">Signed in as {name}</div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="size-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
