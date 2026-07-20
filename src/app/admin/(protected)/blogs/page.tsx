"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminBlogsPage() {
  return (
    <ResourceManager
      title="Blogs"
      description="Manage blog articles published on the site."
      apiPath="/api/admin/blogs"
      columns={[
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
        { key: "author", label: "Author" },
        { key: "published", label: "Published", render: (row) => (row.published ? "Yes" : "No") },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "excerpt", label: "Excerpt", type: "textarea", required: true },
        { name: "content", label: "Content", type: "textarea", required: true },
        { name: "category", label: "Category", type: "text", required: true },
        { name: "author", label: "Author", type: "text", required: true },
        { name: "image", label: "Image URL", type: "text", required: true },
        { name: "readTime", label: "Read Time", type: "text", placeholder: "5 min read" },
        { name: "date", label: "Publish Date", type: "text", placeholder: "2026-07-20", required: true },
        { name: "published", label: "Published", type: "checkbox" },
      ]}
      defaultValues={{ published: true, readTime: "5 min read", date: new Date().toISOString().slice(0, 10) }}
    />
  );
}
