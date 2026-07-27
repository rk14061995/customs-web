import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/shared/ThemeProvider";
import { siteConfig } from "@/lib/data";
import { getSettings } from "@/lib/queries";

const GA_MEASUREMENT_ID = "G-9S78G2B4H6";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings?.siteName ?? siteConfig.name;
  const tagline = settings?.tagline ?? siteConfig.tagline;
  const description = settings?.description ?? siteConfig.description;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${name} | ${tagline}`,
      template: `%s | ${name}`,
    },
    description,
    keywords: [
      "logistics",
      "courier",
      "freight forwarding",
      "air freight",
      "ocean freight",
      "international shipping",
      "warehousing",
    ],
    openGraph: {
      type: "website",
      siteName: name,
      title: `${name} | ${tagline}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | ${tagline}`,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6571647795718472"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
