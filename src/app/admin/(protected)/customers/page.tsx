"use client";

import ResourceManager from "@/components/admin/ResourceManager";
import CustomerWalletAdjust from "@/components/admin/CustomerWalletAdjust";

export default function AdminCustomersPage() {
  return (
    <div className="space-y-8">
      <ResourceManager
        title="Customers"
        description="Manage client accounts linked to shipments and invoices."
        apiPath="/api/admin/customers"
        columns={[
          { key: "name", label: "Name" },
          { key: "company", label: "Company" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          {
            key: "walletBalance",
            label: "Wallet",
            render: (row) => `₹${Number(row.walletBalance ?? 0).toLocaleString("en-IN")}`,
          },
          {
            key: "hasPortalAccess",
            label: "Portal Access",
            render: (row) =>
              row.hasPortalAccess ? (
                <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                  Yes
                </span>
              ) : (
                <span className="rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-semibold text-foreground/50">
                  No
                </span>
              ),
          },
        ]}
        fields={[
          { name: "name", label: "Full Name", type: "text", required: true },
          { name: "company", label: "Company", type: "text" },
          { name: "email", label: "Email", type: "text", required: true },
          { name: "phone", label: "Phone", type: "text", required: true },
          { name: "address", label: "Address", type: "textarea" },
          { name: "gstNumber", label: "GST / Tax Number", type: "text" },
          { name: "stateName", label: "State", type: "text", placeholder: "e.g. Delhi" },
          { name: "stateCode", label: "State Code", type: "text", placeholder: "e.g. 07" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
      <CustomerWalletAdjust />
    </div>
  );
}
