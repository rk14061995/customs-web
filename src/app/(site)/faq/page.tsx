import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import FaqAccordion from "@/components/faq/FaqAccordion";
import CTA from "@/components/home/CTA";
import { getFaqs, getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/data";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Rana Forwarder's shipping, tracking, pricing, and customs services.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSettings()]);

  return (
    <>
      <section className="bg-navy py-20 text-center md:py-28">
        <Container>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            FAQ
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Everything you need to know about shipping, tracking, and pricing
            with Rana Forwarder.
          </p>
        </Container>
      </section>
      <Section>
        <Container>
          <FaqAccordion faqs={faqs} />
        </Container>
      </Section>
      <Section className="pt-0">
        <CTA phone={settings?.phone ?? siteConfig.phone} />
      </Section>
    </>
  );
}
