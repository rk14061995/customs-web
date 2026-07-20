import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import BlogList from "@/components/blog/BlogList";
import { getBlogPosts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Blog",
  description: "Insights, guides, and industry news from the Rana Forwarder logistics team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <section className="bg-navy py-20 text-center md:py-28">
        <Container>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            Blog
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            Logistics Insights & Industry News
          </h1>
        </Container>
      </section>
      <Section>
        <Container>
          <BlogList posts={posts} />
        </Container>
      </Section>
    </>
  );
}
