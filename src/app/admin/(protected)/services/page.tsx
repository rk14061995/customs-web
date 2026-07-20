"use client";

import ResourceManager from "@/components/admin/ResourceManager";

const iconOptions = [
  "Plane", "Ship", "Truck", "Warehouse", "ClipboardCheck", "Zap",
  "Globe2", "MapPin", "ShieldCheck", "ArrowLeftRight",
].map((v) => ({ value: v, label: v }));

export default function AdminServicesPage() {
  return (
    <ResourceManager
      title="Services"
      description="Manage the logistics services shown across the site."
      apiPath="/api/admin/services"
      columns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "shortDescription", label: "Short Description" },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "slug", label: "Slug", type: "text", required: true, helperText: "URL-friendly, e.g. air-freight" },
        { name: "shortDescription", label: "Short Description", type: "textarea", required: true },
        { name: "description", label: "Full Description", type: "textarea", required: true },
        { name: "icon", label: "Icon", type: "select", options: iconOptions, required: true },
        { name: "image", label: "Image URL", type: "text", required: true },
        { name: "benefits", label: "Benefits (one per line)", type: "list" },
        { name: "order", label: "Sort Order", type: "number" },
      ]}
      defaultValues={{ benefits: [], order: 0 }}
    />
  );
}
