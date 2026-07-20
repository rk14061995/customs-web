"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PackageSearch, Send, ShieldCheck, Clock } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Hero({
  headline,
  subtitle,
}: {
  headline: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=2000&auto=format&fit=crop"
          alt="Container ship and cargo plane representing global logistics"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy-dark" />
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-orange/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-navy-dark/40 blur-3xl" />
      </div>

      <Container className="relative py-28 md:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
          >
            <ShieldCheck className="size-4 text-orange" />
            Trusted by 35,000+ businesses worldwide
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg text-white/70"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button href="/quote" size="lg" icon={Send}>
              Get a Free Quote
            </Button>
            <Button href="/track-shipment" size="lg" variant="outline" icon={PackageSearch}>
              Track Shipment
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-sm text-white/50"
          >
            <Clock className="size-4" />
            Average pickup within 4 hours across major metros
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
