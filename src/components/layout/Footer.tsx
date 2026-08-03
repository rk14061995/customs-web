import Link from "next/link";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Container from "@/components/ui/Container";
import { siteConfig } from "@/lib/data";
import { FacebookIcon, TwitterIcon, LinkedinIcon, InstagramIcon } from "@/components/ui/SocialIcons";

const linkGroups = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Air Freight", href: "/services/air-freight" },
      { label: "Ocean Freight", href: "/services/ocean-freight" },
      { label: "Road Transport", href: "/services/road-transport" },
      { label: "Warehousing", href: "/services/warehousing" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "Track Shipment", href: "/track-shipment" },
      { label: "Get a Quote", href: "/quote" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-conditions" },
    ],
  },
];

type SettingsProp = {
  siteName: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  social: { facebook?: string; twitter?: string; linkedin?: string; instagram?: string };
};

export default function Footer({ settings }: { settings: SettingsProp }) {
  const socials = [
    { icon: FacebookIcon, href: settings.social.facebook ?? siteConfig.social.facebook, label: "Facebook" },
    { icon: TwitterIcon, href: settings.social.twitter ?? siteConfig.social.twitter, label: "Twitter" },
    { icon: LinkedinIcon, href: settings.social.linkedin ?? siteConfig.social.linkedin, label: "LinkedIn" },
    { icon: InstagramIcon, href: settings.social.instagram ?? siteConfig.social.instagram, label: "Instagram" },
  ];

  return (
    <footer className="border-t border-border-subtle bg-surface">
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-dark text-lg font-bold text-white">
                R
              </span>
              <span className="font-heading text-lg font-bold text-foreground">
                {settings.siteName}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/60">
              {siteConfig.description}
            </p>
            <div className="mt-6 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-full border border-border-subtle text-foreground/60 transition-colors hover:border-orange hover:bg-orange hover:text-white"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:contents">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/60 transition-colors hover:text-orange"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Newsletter</h3>
            <p className="mt-4 text-sm text-foreground/60">
              Get logistics insights and updates in your inbox.
            </p>
            <form className="mt-4 flex items-center gap-2">
              <input
                type="email"
                required
                placeholder="Your email"
                className="w-full min-w-0 rounded-full border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange text-white transition-colors hover:bg-orange-dark"
              >
                <Send className="size-4" />
              </button>
            </form>
            <ul className="mt-6 space-y-3 text-sm text-foreground/60">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-orange" />
                {settings.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-orange" />
                {settings.phone}
                {settings.alternatePhone && ` / ${settings.alternatePhone}`}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-orange" />
                {settings.email}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border-subtle pt-8 text-center sm:mt-12 sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-foreground/50">
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/50">
            <Link href="/privacy-policy" className="hover:text-orange">Privacy Policy</Link>
            <Link href="/terms-conditions" className="hover:text-orange">Terms & Conditions</Link>
            <a
              href="https://www.autovision-pro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange"
            >
              Our Partners
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
