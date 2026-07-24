"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminCarriersPage() {
  return (
    <ResourceManager
      title="Carriers"
      description="Manage courier and freight partners used to fulfil shipments."
      apiPath="/api/admin/carriers"
      columns={[
        { key: "name", label: "Name" },
        { key: "contactPerson", label: "Contact" },
        { key: "phone", label: "Phone" },
        { key: "serviceAreas", label: "Service Areas" },
        { key: "provider", label: "Tracking API" },
        {
          key: "active",
          label: "Active",
          render: (row) => (row.active ? "Yes" : "No"),
        },
      ]}
      fields={[
        { name: "name", label: "Carrier Name", type: "text", required: true },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "email", label: "Email", type: "text" },
        { name: "serviceAreas", label: "Service Areas", type: "text", placeholder: "e.g. Domestic, Europe, Middle East" },
        { name: "vehicleType", label: "Vehicle / Mode Type", type: "text", placeholder: "e.g. Air, Sea, Truck" },
        {
          name: "provider",
          label: "Live Tracking API",
          type: "select",
          options: [
            { value: "Other", label: "None / Manual" },
            { value: "Ship24", label: "Ship24 (universal — recommended)" },
            { value: "UPS", label: "UPS" },
            { value: "FedEx", label: "FedEx" },
            { value: "DHL", label: "DHL" },
          ],
          helperText: "Ship24 covers ~1200 couriers with one API key. UPS/FedEx/DHL call that carrier's own API directly.",
        },
        {
          name: "ship24CourierCode",
          label: "Ship24 Courier Code (optional)",
          type: "text",
          placeholder: "e.g. dhl, india-post — leave blank to auto-detect",
          helperText: "Only used when Live Tracking API is set to Ship24.",
        },
        { name: "active", label: "Active", type: "checkbox" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      defaultValues={{ active: true, provider: "Other" }}
    />
  );
}
