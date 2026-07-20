"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, Search, PackageSearch, Send } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { getIcon } from "@/lib/icons";
import type { Service } from "@/types";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services", megaMenu: true },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar({
  services,
  siteName,
  tagline,
}: {
  services: Service[];
  siteName: string;
  tagline: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const featuredServices = services.slice(0, 6);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border-subtle bg-background/85 shadow-sm backdrop-blur-lg"
          : "border-b border-transparent bg-background/60 backdrop-blur-sm"
      }`}
    >
      <Container>
        <div className="flex h-18 items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-dark text-lg font-bold text-white">
              R
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-lg font-bold text-foreground">
                {siteName}
              </span>
              <span className="text-[11px] font-medium tracking-wide text-orange">
                {tagline}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) =>
              link.megaMenu ? (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setMegaOpen(true)}
                  onMouseLeave={() => setMegaOpen(false)}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-navy/5 hover:text-navy dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {link.label}
                    <ChevronDown className="size-3.5" />
                  </Link>
                  <AnimatePresence>
                    {megaOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 top-full w-[640px] -translate-x-1/2 pt-3"
                      >
                        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border-subtle bg-background p-4 shadow-2xl">
                          {featuredServices.map((service) => {
                            const Icon = getIcon(service.icon);
                            return (
                              <Link
                                key={service.slug}
                                href={`/services/${service.slug}`}
                                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-navy/5 dark:hover:bg-white/5"
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy dark:bg-white/10 dark:text-white">
                                  <Icon className="size-4.5" />
                                </span>
                                <span>
                                  <span className="block text-sm font-semibold text-foreground">
                                    {service.title}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-foreground/60">
                                    {service.shortDescription}
                                  </span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-navy/5 hover:text-navy dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="hidden size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-navy/5 hover:text-navy dark:hover:bg-white/10 dark:hover:text-white sm:flex"
            >
              <Search className="size-[18px]" />
            </button>
            <ThemeToggle />
            <Button href="/track-shipment" variant="ghost" size="sm" icon={PackageSearch} iconPosition="left" className="hidden md:inline-flex">
              Track
            </Button>
            <Button href="/quote" size="sm" icon={Send} className="hidden sm:inline-flex">
              Get Quote
            </Button>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex size-9 items-center justify-center rounded-full text-foreground/80 hover:bg-navy/5 dark:hover:bg-white/10 lg:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 border-t border-border-subtle py-3">
                <Search className="size-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search services, tracking, blog..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
                />
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border-subtle bg-background lg:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-navy/5 dark:hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/track-shipment" className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-navy/5 dark:hover:bg-white/10">
                Track Shipment
              </Link>
              <Link href="/faq" className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-navy/5 dark:hover:bg-white/10">
                FAQ
              </Link>
              <div className="mt-2 flex gap-2 px-4">
                <Button href="/quote" className="w-full">
                  Get Quote
                </Button>
              </div>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
