import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CTA from "@/components/home/CTA";
import { getServices, getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/data";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore Rana Forwarder's full range of logistics services — air freight, ocean freight, road transport, warehousing, customs clearance, and more.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([getServices(), getSettings()]);

  return (
    <>
      <section className="bg-navy py-20 text-center md:py-28">
        <Container>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            Our Services
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            Complete Logistics Solutions Under One Roof
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Whichever mode your cargo needs, we have a dedicated team and
            proven process to get it there safely and on time.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeading title="Explore Our Services" align="left" className="mx-0" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.slug} className="flex flex-col overflow-hidden p-0">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground/60">{service.shortDescription}</p>
                  <ul className="mt-4 space-y-2">
                    {service.benefits.slice(0, 2).map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-foreground/70">
                        <Check className="mt-0.5 size-4 shrink-0 text-orange" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Button href={`/services/${service.slug}`} variant="ghost" size="sm" icon={ArrowRight} className="pl-0">
                      Learn More
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <CTA phone={settings?.phone ?? siteConfig.phone} />
      </Section>
    </>
  );
}
