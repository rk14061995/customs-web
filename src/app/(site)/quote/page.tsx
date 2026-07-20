import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import QuoteForm from "@/components/quote/QuoteForm";
import RateCalculator from "@/components/quote/RateCalculator";

export const metadata: Metadata = {
  title: "Get a Quote",
  description: "Request a customized logistics quote from Rana Forwarder for air, ocean, road freight, or warehousing.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <section className="bg-navy py-20 text-center md:py-28">
        <Container>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            Get a Quote
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            Request Your Custom Shipping Quote
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Tell us about your shipment and our team will respond with a
            tailored quote within 24 hours.
          </p>
        </Container>
      </section>
      <Section>
        <Container>
          <div className="mx-auto mb-10 max-w-2xl">
            <RateCalculator />
          </div>
          <QuoteForm />
        </Container>
      </Section>
    </>
  );
}
