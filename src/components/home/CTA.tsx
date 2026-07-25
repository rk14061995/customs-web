"use client";

import { motion } from "framer-motion";
import { Send, PhoneCall } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { fadeUp, viewportOnce } from "@/lib/motion";

export default function CTA({ phone }: { phone: string }) {
  return (
    <Container>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-dark px-8 py-16 text-center sm:px-16"
      >
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-orange/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-72 rounded-full bg-white/5 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Ship With Confidence?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Get an instant quote or speak with our logistics experts to find the
            right solution for your business.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/quote" size="lg" icon={Send}>
              Get a Free Quote
            </Button>
            <Button href={`tel:${phone.replace(/[^+\d]/g, "")}`} size="lg" variant="outline" icon={PhoneCall}>
              Call Us Now
            </Button>
          </div>
        </div>
      </motion.div>
    </Container>
  );
}
