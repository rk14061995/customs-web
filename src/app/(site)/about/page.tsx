import type { Metadata } from "next";
import Image from "next/image";
import { Target, Eye, HeartHandshake, ShieldCheck, Users, Sparkles } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import Stats from "@/components/home/Stats";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import CTA from "@/components/home/CTA";
import { companyTimeline, stats as fallbackStats, siteConfig } from "@/lib/data";
import { getTeamMembers, getHomepageContent, getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Rana Forwarder's 20+ year journey building a trusted global logistics network across 220+ countries.",
  alternates: { canonical: "/about" },
};

const coreValues = [
  { icon: ShieldCheck, title: "Integrity", description: "Transparent pricing and honest communication, every shipment." },
  { icon: Sparkles, title: "Excellence", description: "Relentless attention to detail across every stage of delivery." },
  { icon: HeartHandshake, title: "Partnership", description: "We treat every client relationship as a long-term partnership." },
  { icon: Users, title: "People First", description: "Investing in our team so they can take care of your cargo." },
];

export default async function AboutPage() {
  const [teamMembers, homepage, settings] = await Promise.all([
    getTeamMembers(),
    getHomepageContent(),
    getSettings(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-navy py-24 md:py-32">
        <Image
          src="https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=2000&auto=format&fit=crop"
          alt="Rana Forwarder logistics operations"
          fill
          priority
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy-dark" />
        <Container className="relative text-center">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            About Rana Forwarder
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            Two Decades of Delivering Trust Across Borders
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            From a single domestic courier office to a global logistics network
            spanning 220+ countries — this is our story.
          </p>
        </Container>
      </section>

      <Stats stats={homepage?.stats ?? fallbackStats} />

      <Section>
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="mb-3 inline-block rounded-full bg-orange/10 px-4 py-1.5 text-sm font-semibold text-orange">
                Our Story
              </span>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Built by Logistics People, for Growing Businesses
              </h2>
              <p className="mt-5 text-foreground/70">
                Rana Forwarder started in 2005 as a small domestic courier
                operation with a single promise: deliver on time, every time.
                Two decades later, that promise has scaled into a full-service
                logistics network spanning air, ocean, and road freight,
                warehousing, and customs brokerage across 220+ countries.
              </p>
              <p className="mt-4 text-foreground/70">
                Today, we serve over 35,000 businesses worldwide, combining
                industry expertise with modern tracking technology to keep
                cargo moving — and our clients informed — every step of the
                way.
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=1200&auto=format&fit=crop"
                alt="Rana Forwarder warehouse and team"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </Section>

      <div className="bg-surface">
        <Section>
          <Container>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card hover={false} className="bg-background">
                <Target className="size-8 text-orange" />
                <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">Our Mission</h3>
                <p className="mt-2 text-sm text-foreground/60">
                  To make global shipping simple, transparent, and reliable for
                  businesses of every size — connecting them to markets
                  worldwide without friction.
                </p>
              </Card>
              <Card hover={false} className="bg-background">
                <Eye className="size-8 text-orange" />
                <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">Our Vision</h3>
                <p className="mt-2 text-sm text-foreground/60">
                  To be the world&apos;s most trusted logistics partner,
                  recognized for speed, integrity, and customer-first service
                  across every trade route we serve.
                </p>
              </Card>
            </div>
          </Container>
        </Section>
      </div>

      <Section>
        <Container>
          <SectionHeading eyebrow="What Drives Us" title="Our Core Values" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((value) => (
              <div key={value.title} className="text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-navy/10 text-navy dark:bg-white/10 dark:text-white">
                  <value.icon className="size-6" />
                </span>
                <h3 className="mt-4 font-heading font-semibold text-foreground">{value.title}</h3>
                <p className="mt-1 text-sm text-foreground/60">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <div className="bg-surface">
        <Section>
          <Container>
            <SectionHeading eyebrow="Our Journey" title="Company Timeline" />
            <div className="mx-auto max-w-3xl space-y-8">
              {companyTimeline.map((item, i) => (
                <div key={item.year} className="relative flex gap-6 pl-2">
                  <div className="flex flex-col items-center">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy font-heading text-sm font-bold text-white">
                      {item.year}
                    </span>
                    {i !== companyTimeline.length - 1 && (
                      <span className="mt-2 w-px flex-1 bg-border-subtle" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-foreground/60">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      </div>

      <Section>
        <Container>
          <SectionHeading eyebrow="Leadership" title="Meet Our Team" description="The people steering Rana Forwarder's global operations." />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center">
                <div className="relative mx-auto size-24 overflow-hidden rounded-full">
                  <Image src={member.image} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="mt-4 font-heading font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-orange">{member.role}</p>
                <p className="mt-2 text-sm text-foreground/60">{member.bio}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <WhyChooseUs />

      <Section>
        <CTA phone={settings?.phone ?? siteConfig.phone} />
      </Section>
    </>
  );
}
