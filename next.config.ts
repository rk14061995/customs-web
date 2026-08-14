import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its .afm font metrics from disk at runtime relative to its own
  // package directory — bundling it with webpack breaks that lookup, so it must
  // stay external and load via plain Node require instead.
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  // These top-level routes used to duplicate /services/[slug] content (same
  // component, same data) under a second, orphaned URL that nothing on the
  // site actually linked to — a classic cause of "duplicate content, Google
  // chose a different canonical" / "discovered but not indexed" in Search
  // Console. Redirecting consolidates them onto the one URL that's actually
  // linked internally and listed in the sitemap.
  async redirects() {
    const serviceRedirects: Record<string, string> = {
      "air-freight": "air-freight",
      "ocean-freight": "ocean-freight",
      "road-transport": "road-transport",
      "warehousing": "warehousing",
      "domestic-shipping": "domestic-courier",
      "international-shipping": "international-courier",
    };
    return Object.entries(serviceRedirects).map(([from, toSlug]) => ({
      source: `/${from}`,
      destination: `/services/${toSlug}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
