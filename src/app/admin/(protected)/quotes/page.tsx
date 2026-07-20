"use client";

import SubmissionsManager from "@/components/admin/SubmissionsManager";

export default function AdminQuotesPage() {
  return (
    <SubmissionsManager
      title="Quote Requests"
      description="Review and manage incoming shipment quote requests."
      apiPath="/api/admin/quotes"
      statusOptions={["new", "contacted", "quoted", "closed"]}
      previewColumns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "shipmentType", label: "Type" },
      ]}
      detailFields={[
        { key: "name", label: "Name" },
        { key: "company", label: "Company" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "pickupLocation", label: "Pickup Location" },
        { key: "destination", label: "Destination" },
        { key: "shipmentType", label: "Shipment Type" },
        { key: "weight", label: "Weight" },
        { key: "dimensions", label: "Dimensions" },
        { key: "pickupDate", label: "Expected Pickup Date" },
        { key: "message", label: "Message" },
      ]}
    />
  );
}
