import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { siteConfig } from "@/lib/data";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Rana Forwarder's privacy policy explaining how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy-policy" },
};

function buildSections(email: string, phone: string) {
  return [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly, such as your name, company, phone number, email, and shipment details when you request a quote, track a shipment, or contact us. We also collect usage data such as IP address, browser type, and pages visited to improve our services.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to process shipments, respond to enquiries, provide customer support, send service updates, and improve our website and offerings. We do not sell your personal information to third parties.",
  },
  {
    title: "3. Sharing of Information",
    body: "We may share information with carriers, customs authorities, and logistics partners as necessary to fulfill your shipment. We may also share data with service providers who help us operate our platform, under strict confidentiality agreements.",
  },
  {
    title: "4. Data Security",
    body: "We implement industry-standard technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.",
  },
  {
    title: "5. Cookies",
    body: "We use cookies to enhance your browsing experience, analyze site traffic, and remember your preferences. You can control cookie settings through your browser.",
  },
  {
    title: "6. Your Rights",
    body: "You may request access to, correction of, or deletion of your personal data at any time by contacting us using the details below.",
  },
  {
    title: "7. Changes to This Policy",
    body: "We may update this Privacy Policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.",
  },
    {
      title: "8. Contact Us",
      body: `For privacy-related questions, contact us at ${email} or ${phone}.`,
    },
  ];
}

export default async function PrivacyPolicyPage() {
  const settings = await getSettings();
  const sections = buildSections(settings?.email ?? siteConfig.email, settings?.phone ?? siteConfig.phone);

  return (
    <>
      <section className="bg-navy py-16 text-center md:py-20">
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Privacy Policy</h1>
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
