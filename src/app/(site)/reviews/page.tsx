import type { Metadata } from "next";
import Image from "next/image";
import { Star } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import ReviewForm from "@/components/reviews/ReviewForm";
import { getTestimonials } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Read what customers say about shipping with Rana Forwarder, and share your own experience.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const testimonials = await getTestimonials();

  return (
    <>
      <section className="bg-navy py-20 text-center md:py-28">
        <Container>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            Reviews
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            Customer Reviews & Feedback
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Shipped with us? We&apos;d love to hear how it went — your review helps other
            customers and helps us keep improving.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Share Your Experience</h2>
              <p className="mt-2 text-sm text-foreground/60">
                Reviews are checked by our team before they go live, so it may take a day or two
                to appear on the site.
              </p>
              <div className="mt-6">
                <ReviewForm />
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">What Customers Say</h2>
              {testimonials.length === 0 ? (
                <p className="mt-4 text-sm text-foreground/60">
                  No reviews published yet — be the first to share your experience!
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {testimonials.map((t) => (
                    <Card key={t._id} hover={false}>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-orange text-orange" />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/80">&ldquo;{t.quote}&rdquo;</p>
                      <div className="mt-4 flex items-center gap-3">
                        <Image
                          src={t.avatar}
                          alt={t.name}
                          width={36}
                          height={36}
                          className="size-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.name}</p>
                          {(t.role || t.company) && (
                            <p className="text-xs text-foreground/50">
                              {[t.role, t.company].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
