import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import TrackingForm from "@/components/tracking/TrackingForm";

export const metadata: Metadata = {
  title: "Track Shipment",
  description: "Track your Rana Forwarder shipment in real time with your tracking number.",
  alternates: { canonical: "/track-shipment" },
};

export default function TrackShipmentPage() {
  return (
    <>
      <section className="bg-navy py-20 text-center md:py-28">
        <Container>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            Track Shipment
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            Where&apos;s Your Shipment?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Enter your tracking number below to see real-time status and
            delivery milestones.
          </p>
        </Container>
      </section>
      <Section>
        <Container>
          <TrackingForm />
        </Container>
      </Section>
    </>
  );
}
