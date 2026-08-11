"use client";

import { FileText } from "lucide-react";
import ResourceManager from "@/components/admin/ResourceManager";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AdminCreditApprovalsPage() {
  return (
    <ResourceManager
      title="Credit Approvals"
      description="Internal credit approval forms for extending payment terms to a business customer."
      apiPath="/api/admin/credit-approvals"
      defaultValues={{ status: "pending", creditTermDays: 30 }}
      columns={[
        { key: "customerName", label: "Customer" },
        { key: "businessContactPerson", label: "Contact" },
        { key: "creditTermDays", label: "Credit Days", render: (row) => (row.creditTermDays ? `${row.creditTermDays} days` : "—") },
        {
          key: "status",
          label: "Status",
          render: (row) => {
            const status = String(row.status ?? "");
            return (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[status] ?? "bg-foreground/10"}`}>
                {status}
              </span>
            );
          },
        },
        {
          key: "_id",
          label: "PDF",
          render: (row) => (
            <a
              href={`/api/admin/credit-approvals/${row._id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View PDF"
              title="View PDF"
              className="inline-flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
            >
              <FileText className="size-4" />
            </a>
          ),
        },
      ]}
      fields={[
        { name: "customerName", label: "Customer Name", type: "text", required: true },
        { name: "directorName", label: "Director / Proprietor's Name", type: "text" },
        { name: "panNumber", label: "Business Registration Number / PAN", type: "text" },
        { name: "registeredAddress", label: "Registered Office Address", type: "textarea" },
        { name: "invoiceAddress", label: "Address for Invoice or Correspondence", type: "textarea", placeholder: "Same as above" },
        { name: "businessContactPerson", label: "Business Contact Person", type: "text" },
        { name: "financeContactPerson", label: "Finance Contact Person", type: "text" },
        { name: "phone", label: "General Main Line Phone Number", type: "text" },
        { name: "projectedMonthlyRevenue", label: "Projected Monthly Revenue", type: "text" },
        { name: "creditTermDays", label: "Credit Limit (days)", type: "number" },
        { name: "specialInstructions", label: "Special Instructions", type: "textarea" },
        { name: "proposedBySalesman", label: "Proposed By (Salesman)", type: "text" },
        { name: "supportedByDirector", label: "Supported By (Director)", type: "text" },
        { name: "authorizedByFinanceDirector", label: "Authorized By (Director – Finance)", type: "text" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ],
        },
      ]}
    />
  );
}
