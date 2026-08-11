"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminCustomersPage() {
  return (
    <ResourceManager
      title="Customers"
      description="Manage client accounts linked to shipments and invoices."
      apiPath="/api/admin/customers"
      columns={[
        { key: "name", label: "Name" },
        { key: "company", label: "Company" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
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
  );
}
