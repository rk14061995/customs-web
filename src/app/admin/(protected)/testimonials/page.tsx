"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminTestimonialsPage() {
  return (
    <ResourceManager
      title="Testimonials"
      description="Manage client testimonials shown on the homepage."
      apiPath="/api/admin/testimonials"
      columns={[
        { key: "name", label: "Name" },
        { key: "company", label: "Company" },
        { key: "rating", label: "Rating" },
        { key: "published", label: "Published", render: (row) => (row.published ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "company", label: "Company", type: "text", required: true },
        { name: "role", label: "Role", type: "text", required: true },
        { name: "quote", label: "Quote", type: "textarea", required: true },
        { name: "rating", label: "Rating (1-5)", type: "number", required: true },
        { name: "avatar", label: "Avatar URL", type: "text", required: true },
        { name: "published", label: "Published", type: "checkbox" },
      ]}
      defaultValues={{ published: true, rating: 5 }}
    />
  );
}
