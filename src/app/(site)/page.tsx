import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Section from "@/components/ui/Section";
import ServicesGrid from "@/components/home/ServicesGrid";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import LatestBlog from "@/components/home/LatestBlog";
import CTA from "@/components/home/CTA";
import { getServices, getTestimonials, getBlogPosts, getHomepageContent, getSettings } from "@/lib/queries";
import { stats as fallbackStats, siteConfig } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reliable Global Logistics Solutions",
  description:
    "Rana Forwarder delivers air freight, ocean freight, road transport, warehousing, and express courier services across 220+ countries with live tracking.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [services, testimonials, posts, homepage, settings] = await Promise.all([
    getServices(),
    getTestimonials(),
    getBlogPosts(),
    getHomepageContent(),
    getSettings(),
  ]);

  return (
    <>
      <Hero
        headline={homepage?.heroHeadline ?? "Reliable Global Logistics Solutions"}
        subtitle={
          homepage?.heroSubtitle ??
          "Air, ocean, and road freight backed by real-time tracking, customs expertise, and a dedicated support team."
        }
      />
      <Stats stats={homepage?.stats ?? fallbackStats} />
      <Section>
        <ServicesGrid services={services} />
      </Section>
      <WhyChooseUs />
      <Section>
        <HowItWorks />
      </Section>
      <Testimonials testimonials={testimonials} />
      <Section>
        <LatestBlog posts={posts} />
      </Section>
      <Section className="pt-0">
        <CTA phone={settings?.phone ?? siteConfig.phone} />
      </Section>
    </>
  );
}
