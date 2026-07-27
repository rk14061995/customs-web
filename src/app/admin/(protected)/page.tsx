import type { Metadata } from "next";
import Link from "next/link";
import {
  Inbox,
  MessageSquare,
  Newspaper,
  Package,
  Quote as QuoteIcon,
  ArrowUpRight,
  Truck,
  Wallet,
  Clock,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import CurrencySettingsCard from "@/components/admin/CurrencySettingsCard";
import { getAdminStats } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Overview of your shipments, payments, content and customer activity.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Shipments" value={stats.activeShipmentCount} icon={Truck} accent="orange" />
        <StatCard label="Total Shipments" value={stats.shipmentCount} icon={Package} />
        <StatCard label="Revenue Collected" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={Wallet} accent="orange" />
        <StatCard label="Payments Pending" value={`₹${stats.pendingRevenue.toLocaleString()}`} icon={Clock} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="New Quotes" value={stats.newQuoteCount} icon={QuoteIcon} accent="orange" />
        <StatCard label="New Enquiries" value={stats.newContactCount} icon={MessageSquare} accent="orange" />
        <StatCard label="Total Services" value={stats.serviceCount} icon={Package} />
        <StatCard label="Blog Posts" value={stats.blogCount} icon={Newspaper} />
        <StatCard label="Testimonials" value={stats.testimonialCount} icon={Inbox} />
      </div>

      <CurrencySettingsCard initialRate={stats.usdToInrRate} />

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Recent Shipments</h2>
            <Link href="/admin/shipments" className="flex items-center gap-1 text-sm text-orange">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-border-subtle">
            {stats.recentShipments.length === 0 && (
              <li className="py-4 text-sm text-foreground/50">No shipments yet.</li>
            )}
            {stats.recentShipments.map((s) => {
              const customer = s.customer as { name?: string } | undefined;
              return (
                <li key={String(s._id)} className="py-3">
                  <p className="text-sm font-medium text-foreground">
                    {String(s.trackingNumber)} · {customer?.name ?? "—"}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {String(s.origin)} → {String(s.destination)} · {String(s.status)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Recent Quote Requests</h2>
            <Link href="/admin/quotes" className="flex items-center gap-1 text-sm text-orange">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-border-subtle">
            {stats.recentQuotes.length === 0 && (
              <li className="py-4 text-sm text-foreground/50">No quote requests yet.</li>
            )}
            {stats.recentQuotes.map((q) => (
              <li key={String(q._id)} className="py-3">
                <p className="text-sm font-medium text-foreground">{String(q.name)}</p>
                <p className="text-xs text-foreground/50">
                  {String(q.pickupLocation)} → {String(q.destination)} · {formatDate(String(q.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-foreground">Recent Contact Enquiries</h2>
            <Link href="/admin/contacts" className="flex items-center gap-1 text-sm text-orange">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-border-subtle">
            {stats.recentContacts.length === 0 && (
              <li className="py-4 text-sm text-foreground/50">No enquiries yet.</li>
            )}
            {stats.recentContacts.map((c) => (
              <li key={String(c._id)} className="py-3">
                <p className="text-sm font-medium text-foreground">{String(c.name)}</p>
                <p className="text-xs text-foreground/50">
                  {String(c.subject)} · {formatDate(String(c.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
