"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminSeoPage() {
  return (
    <ResourceManager
      title="SEO"
      description="Manage per-page meta titles, descriptions, and keywords."
      apiPath="/api/admin/seo"
      columns={[
        { key: "page", label: "Page" },
        { key: "title", label: "Meta Title" },
        { key: "description", label: "Meta Description" },
      ]}
      fields={[
        { name: "page", label: "Page Identifier", type: "text", required: true, helperText: "e.g. home, about, services" },
        { name: "title", label: "Meta Title", type: "text", required: true },
        { name: "description", label: "Meta Description", type: "textarea", required: true },
        { name: "keywords", label: "Keywords (one per line)", type: "list" },
        { name: "ogImage", label: "OG Image URL", type: "text" },
      ]}
      defaultValues={{ keywords: [] }}
    />
  );
}
