import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import ContactForm from "@/components/contact/ContactForm";
import { siteConfig } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Rana Forwarder for quotes, support, or general enquiries.",
  alternates: { canonical: "/contact" },
};

const info = [
  { icon: MapPin, label: "Office Address", value: siteConfig.address },
  { icon: Phone, label: "Phone", value: `${siteConfig.phone} / ${siteConfig.alternatePhone}` },
  { icon: Mail, label: "Email", value: siteConfig.email },
  { icon: Clock, label: "Business Hours", value: siteConfig.hours },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy py-20 text-center md:py-28">
        <Container>
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            Contact Us
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            We&apos;d Love to Hear From You
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Reach out for quotes, support, or partnership enquiries — our team
            typically responds within one business day.
          </p>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {info.map((item) => (
                  <Card key={item.label} hover={false} className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                      <item.icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/50">{item.label}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="mt-6 overflow-hidden rounded-3xl border border-border-subtle">
                <iframe
                  title="Rana Forwarder Office Location"
                  src="https://www.google.com/maps?q=Metro+City&output=embed"
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
