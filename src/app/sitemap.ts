import type { MetadataRoute } from "next";
import { getServices, getBlogPosts } from "@/lib/queries";

const BASE_URL = "https://www.ranaforwarder.com";

const staticRoutes = [
  "",
  "/about",
  "/services",
  "/international-shipping",
  "/domestic-shipping",
  "/air-freight",
  "/ocean-freight",
  "/road-transport",
  "/warehousing",
  "/track-shipment",
  "/quote",
  "/blog",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/terms-conditions",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, posts] = await Promise.all([getServices(), getBlogPosts()]);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...serviceEntries, ...blogEntries];
}
