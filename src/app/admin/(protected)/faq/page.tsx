"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminFaqPage() {
  return (
    <ResourceManager
      title="FAQ"
      description="Manage frequently asked questions."
      apiPath="/api/admin/faq"
      columns={[
        { key: "question", label: "Question" },
        { key: "category", label: "Category" },
        { key: "order", label: "Order" },
      ]}
      fields={[
        { name: "question", label: "Question", type: "text", required: true },
        { name: "answer", label: "Answer", type: "textarea", required: true },
        { name: "category", label: "Category", type: "text", required: true },
        { name: "order", label: "Sort Order", type: "number" },
      ]}
      defaultValues={{ order: 0 }}
    />
  );
}
