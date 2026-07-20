import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Send } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CTA from "@/components/home/CTA";
import type { Service } from "@/types";

export default function ServiceDetail({
  service,
  related,
}: {
  service: Service;
  related: Service[];
}) {
  return (
    <>
      <section className="relative overflow-hidden bg-navy py-20 md:py-28">
        <Image src={service.image} alt={service.title} fill className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy-dark" />
        <Container className="relative">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="size-3.5" />
            <Link href="/services" className="hover:text-white">Services</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-white">{service.title}</span>
          </nav>
          <h1 className="max-w-2xl text-4xl font-bold text-white sm:text-5xl">{service.title}</h1>
          <p className="mt-5 max-w-xl text-white/70">{service.shortDescription}</p>
          <div className="mt-8">
            <Button href="/quote" size="lg" icon={Send}>Get a Quote</Button>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Overview</h2>
              <p className="mt-4 text-foreground/70">{service.description}</p>

              <h2 className="mt-10 text-2xl font-bold text-foreground sm:text-3xl">Key Benefits</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {service.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 rounded-2xl border border-border-subtle p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
                      <Check className="size-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card hover={false} className="sticky top-24 bg-surface">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Ready to ship with {service.title}?
              </h3>
              <p className="mt-2 text-sm text-foreground/60">
                Get an instant quote or talk to our logistics specialists about
                your shipment requirements.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Button href="/quote" className="w-full">Get a Free Quote</Button>
                <Button href="/contact" variant="ghost" className="w-full">Contact Sales</Button>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <div className="bg-surface">
        <Section>
          <Container>
            <SectionHeading eyebrow="Explore More" title="Related Services" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`}>
                  <Card className="h-full bg-background">
                    <h3 className="font-heading font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-2 text-sm text-foreground/60">{s.shortDescription}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </div>

      <Section>
        <CTA />
      </Section>
    </>
  );
}
