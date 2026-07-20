"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Calendar, ArrowUpRight } from "lucide-react";
import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/types";

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((p) => p.category)))],
    [posts]
  );

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const matchesQuery =
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [posts, query, category]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-navy text-white"
                  : "bg-surface text-foreground/60 hover:bg-navy/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-full border border-border-subtle bg-background py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-foreground/40 focus:border-navy"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-foreground/50">No articles match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <Card className="h-full overflow-hidden p-0">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-navy backdrop-blur-sm">
                    {post.category}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                    <Calendar className="size-3.5" />
                    {formatDate(post.date)}
                    <span>·</span>
                    {post.readTime}
                  </div>
                  <h3 className="mt-2 flex items-start justify-between gap-2 font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-orange">
                    {post.title}
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-foreground/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange" />
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/60">{post.excerpt}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
