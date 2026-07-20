"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminTeamPage() {
  return (
    <ResourceManager
      title="Team"
      description="Manage team members shown on the About page."
      apiPath="/api/admin/team"
      columns={[
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "order", label: "Order" },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "role", label: "Role", type: "text", required: true },
        { name: "image", label: "Photo URL", type: "text", required: true },
        { name: "bio", label: "Bio", type: "textarea", required: true },
        { name: "order", label: "Sort Order", type: "number" },
      ]}
      defaultValues={{ order: 0 }}
    />
  );
}
