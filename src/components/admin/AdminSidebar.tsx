"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
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
  CreditCard,
  Contact2,
  Ship,
  Receipt,
  FileSignature,
  FileText,
  BadgeCheck,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Purely cosmetic grouping — no routes changed, nothing merged or removed, just visually
 * clustered so ~19 flat items read as a handful of decisions instead of one long list.
 * `section: null` renders with no header (top-level items like Dashboard).
 */
const navGroups: { section: string | null; items: { label: string; href: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    section: null,
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    section: "Operations",
    items: [
      { label: "Shipments", href: "/admin/shipments", icon: Truck },
      { label: "Quotations", href: "/admin/quotations", icon: Receipt },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Bills", href: "/admin/bills", icon: FileText },
    ],
  },
  {
    section: "Customer Documents",
    items: [
      { label: "Agreements", href: "/admin/agreements", icon: FileSignature },
      { label: "Credit Approvals", href: "/admin/credit-approvals", icon: BadgeCheck },
      { label: "Documents", href: "/admin/documents", icon: FolderOpen },
    ],
  },
  {
    section: "CRM",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Contact2 },
      { label: "Carriers", href: "/admin/carriers", icon: Ship },
    ],
  },
  {
    section: "Inbox",
    items: [
      { label: "Quotes", href: "/admin/quotes", icon: Inbox },
      { label: "Contacts", href: "/admin/contacts", icon: MessageSquare },
    ],
  },
  {
    section: "Website",
    items: [
      { label: "Services", href: "/admin/services", icon: Package },
      { label: "Blogs", href: "/admin/blogs", icon: Newspaper },
      { label: "Testimonials", href: "/admin/testimonials", icon: QuoteIcon },
      { label: "Team", href: "/admin/team", icon: Users },
      { label: "Homepage", href: "/admin/homepage", icon: Home },
      { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
    ],
  },
  {
    section: "Site",
    items: [
      { label: "SEO", href: "/admin/seo", icon: Search },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  // Exclusive accordion — only one section open at a time; opening another closes it.
  // Operations starts open; clicking the open section again closes it (none open).
  const [openSection, setOpenSection] = useState<string | null>("Operations");

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
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
          <p className="text-xs text-foreground/50">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navGroups.map((group, gi) => {
          // Purely the default + whatever the admin has manually toggled — no auto-expanding
          // based on the current page, so a section stays exactly as closed/open as left.
          const isOpen = !group.section || openSection === group.section;
          return (
            <div key={group.section ?? `group-${gi}`} className={gi > 0 ? "pt-2" : undefined}>
              {group.section && (
                <button
                  type="button"
                  onClick={() => toggleSection(group.section as string)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/70 transition-colors hover:text-foreground"
                >
                  {group.section}
                  <ChevronDown className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} />
                </button>
              )}
              <div
                aria-hidden={group.section ? !isOpen : undefined}
                className={cn(
                  group.section && "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
                  group.section && (isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")
                )}
              >
                <div className="space-y-1 pt-0.5">
                  {group.items.map((item) => {
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
                </div>
              </div>
            </div>
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
