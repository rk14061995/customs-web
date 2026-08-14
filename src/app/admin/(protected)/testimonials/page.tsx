"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminTestimonialsPage() {
  return (
    <ResourceManager
      title="Testimonials & Reviews"
      description="Approve customer-submitted reviews (from the public /reviews page) and manage curated testimonials shown on the homepage. Toggle 'Published' to approve a review — it goes live on the site immediately."
      apiPath="/api/admin/testimonials"
      columns={[
        { key: "name", label: "Name" },
        { key: "rating", label: "Rating", render: (row) => "★".repeat(Number(row.rating) || 0) },
        { key: "source", label: "Source", render: (row) => (row.source === "customer" ? "Customer" : "Admin") },
        { key: "email", label: "Email" },
        { key: "published", label: "Published", render: (row) => (row.published ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "text", helperText: "Never shown publicly — used for follow-up only." },
        { name: "company", label: "Company", type: "text" },
        { name: "role", label: "Role", type: "text" },
        { name: "quote", label: "Review / Quote", type: "textarea", required: true },
        { name: "rating", label: "Rating (1-5)", type: "number", required: true },
        { name: "avatar", label: "Avatar URL", type: "text", required: true },
        { name: "published", label: "Published (approved)", type: "checkbox" },
      ]}
      defaultValues={{ published: true, rating: 5, source: "admin" }}
    />
  );
}
