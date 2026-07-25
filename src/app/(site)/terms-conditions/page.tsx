import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { siteConfig } from "@/lib/data";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms and conditions governing your use of Rana Forwarder's services.",
  alternates: { canonical: "/terms-conditions" },
};

function buildSections(email: string, phone: string) {
  return [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing our website or using our shipping and logistics services, you agree to be bound by these Terms & Conditions and our Privacy Policy.",
  },
  {
    title: "2. Services",
    body: "Rana Forwarder provides freight forwarding, courier, warehousing, and customs brokerage services. Service availability may vary by location and is subject to carrier and regulatory constraints.",
  },
  {
    title: "3. Quotes and Pricing",
    body: "Quotes provided are estimates based on the information supplied and may be adjusted based on actual shipment weight, dimensions, or customs assessments. Final pricing will be confirmed before shipment.",
  },
  {
    title: "4. Prohibited Items",
    body: "Certain items are prohibited or restricted from shipment based on destination regulations, including hazardous materials, illegal goods, and items restricted by customs authorities. Customers are responsible for ensuring compliance.",
  },
  {
    title: "5. Liability",
    body: "Rana Forwarder's liability for loss or damage is limited to the declared value of the shipment or the coverage provided under applicable cargo insurance, whichever is lower.",
  },
  {
    title: "6. Delivery Timeframes",
    body: "Estimated delivery timeframes are not guaranteed and may be affected by customs processing, weather, carrier delays, or other factors outside our control.",
  },
  {
    title: "7. Payment Terms",
    body: "Payment is due as agreed at the time of booking unless a business account with approved credit terms has been established.",
  },
  {
    title: "8. Governing Law",
    body: "These terms are governed by the laws of the jurisdiction in which Rana Forwarder is headquartered, without regard to conflict of law principles.",
  },
    {
      title: "9. Contact",
      body: `Questions about these terms can be directed to ${email} or ${phone}.`,
    },
  ];
}

export default async function TermsConditionsPage() {
  const settings = await getSettings();
  const sections = buildSections(settings?.email ?? siteConfig.email, settings?.phone ?? siteConfig.phone);

  return (
    <>
      <section className="bg-navy py-16 text-center md:py-20">
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Terms & Conditions</h1>
          <p className="mt-4 text-white/70">Last updated: July 20, 2026</p>
        </Container>
      </section>
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                <p className="mt-2 text-foreground/70">{section.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
