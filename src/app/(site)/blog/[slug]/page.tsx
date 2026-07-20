import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, ChevronRight, ArrowLeft } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { getBlogPosts, getBlogBySlug } from "@/lib/queries";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { images: [post.image] },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const posts = await getBlogPosts();
  const related = posts.filter((p) => p.slug !== slug).slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    author: { "@type": "Person", name: post.author },
    datePublished: post.date,
    articleSection: post.category,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Section className="pb-0">
        <Container>
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-foreground/50">
            <Link href="/" className="hover:text-orange">Home</Link>
            <ChevronRight className="size-3.5" />
            <Link href="/blog" className="hover:text-orange">Blog</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{post.title}</span>
          </nav>

          <span className="rounded-full bg-orange/10 px-4 py-1.5 text-sm font-semibold text-orange">
            {post.category}
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-5 flex items-center gap-4 text-sm text-foreground/50">
            <span className="flex items-center gap-1.5"><User className="size-4" />{post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="size-4" />{formatDate(post.date)}</span>
            <span>{post.readTime}</span>
          </div>

          <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-3xl">
            <Image src={post.image} alt={post.title} fill priority className="object-cover" />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-relaxed text-foreground/80">{post.content}</p>
            <div className="mt-10">
              <Button href="/blog" variant="ghost" icon={ArrowLeft} iconPosition="left">
                Back to Blog
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <div className="bg-surface">
        <Section>
          <Container>
            <h2 className="mb-8 text-2xl font-bold text-foreground">Related Articles</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`}>
                  <Card className="h-full overflow-hidden p-0 bg-background">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image src={p.image} alt={p.title} fill className="object-cover" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading font-semibold text-foreground">{p.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground/60">{p.excerpt}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}
