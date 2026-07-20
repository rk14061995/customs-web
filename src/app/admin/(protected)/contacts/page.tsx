"use client";

import SubmissionsManager from "@/components/admin/SubmissionsManager";

export default function AdminContactsPage() {
  return (
    <SubmissionsManager
      title="Contact Enquiries"
      description="Review and manage incoming contact form submissions."
      apiPath="/api/admin/contacts"
      statusOptions={["new", "responded", "closed"]}
      previewColumns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "subject", label: "Subject" },
      ]}
      detailFields={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "subject", label: "Subject" },
        { key: "message", label: "Message" },
      ]}
    />
  );
}
