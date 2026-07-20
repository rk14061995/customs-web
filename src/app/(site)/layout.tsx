import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import LiveChatWidget from "@/components/shared/LiveChatWidget";
import BackToTop from "@/components/shared/BackToTop";
import CookieBanner from "@/components/shared/CookieBanner";
import { siteConfig } from "@/lib/data";
import { getSettings, getServices } from "@/lib/queries";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);

  const resolvedSettings = settings ?? {
    siteName: siteConfig.name,
    tagline: siteConfig.tagline,
    phone: siteConfig.phone,
    whatsapp: siteConfig.whatsapp,
    email: siteConfig.email,
    address: siteConfig.address,
    hours: siteConfig.hours,
    social: siteConfig.social,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: resolvedSettings.siteName,
    description: siteConfig.description,
    url: "https://www.ranaforwarder.com",
    logo: "https://www.ranaforwarder.com/favicon.ico",
    telephone: resolvedSettings.phone,
    email: resolvedSettings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: resolvedSettings.address,
    },
    sameAs: Object.values(resolvedSettings.social).filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Navbar services={services} siteName={resolvedSettings.siteName} tagline={resolvedSettings.tagline} />
      <main>{children}</main>
      <Footer settings={resolvedSettings} />
      <WhatsAppButton whatsapp={resolvedSettings.whatsapp} />
      <LiveChatWidget />
      <BackToTop />
      <CookieBanner />
    </>
  );
}
