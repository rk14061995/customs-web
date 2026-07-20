"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Newspaper,
  Quote as QuoteIcon,
  Inbox,
  MessageSquare,
  HelpCircle,
  Home,
  Users,
  Settings,
  Search,
  LogOut,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Services", href: "/admin/services", icon: Package },
  { label: "Blogs", href: "/admin/blogs", icon: Newspaper },
  { label: "Testimonials", href: "/admin/testimonials", icon: QuoteIcon },
  { label: "Quotes", href: "/admin/quotes", icon: Inbox },
  { label: "Contacts", href: "/admin/contacts", icon: MessageSquare },
  { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
  { label: "Homepage", href: "/admin/homepage", icon: Home },
  { label: "Team", href: "/admin/team", icon: Users },
  { label: "SEO", href: "/admin/seo", icon: Search },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-subtle bg-background lg:flex">
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-6 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-navy text-white">
          <Truck className="size-4.5" />
        </span>
        <div>
          <p className="font-heading text-sm font-bold text-foreground">Rana Forwarder</p>
          <p className="text-xs text-foreground/50">Admin Panel</p>
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
                active
                  ? "bg-navy text-white"
                  : "text-foreground/70 hover:bg-navy/5 dark:hover:bg-white/5"
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
