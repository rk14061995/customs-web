"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { fadeUp, viewportOnce } from "@/lib/motion";
import type { BlogPost } from "@/types";

export default function LatestBlog({ posts }: { posts: BlogPost[] }) {
  return (
    <Container>
      <SectionHeading eyebrow="Insights" title="Latest From Our Blog" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post, i) => (
          <motion.div key={post.slug} custom={i} initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUp}>
            <Link href={`/blog/${post.slug}`} className="group block overflow-hidden rounded-3xl border border-border-subtle">
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
                <h3 className="mt-2 font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-orange">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-foreground/60">{post.excerpt}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Button href="/blog" variant="ghost" icon={ArrowRight}>
          View All Articles
        </Button>
      </div>
    </Container>
  );
}
