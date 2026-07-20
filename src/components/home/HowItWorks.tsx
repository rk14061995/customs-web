"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { howItWorks } from "@/lib/data";
import { fadeUp, viewportOnce } from "@/lib/motion";

export default function HowItWorks() {
  return (
    <Container>
      <SectionHeading
        eyebrow="Our Process"
        title="How It Works"
        description="A streamlined process designed to move your cargo efficiently, every step of the way."
      />
      <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
        <div className="absolute top-8 hidden h-px w-full bg-gradient-to-r from-transparent via-border-subtle to-transparent lg:block" />
        {howItWorks.map((item, i) => (
          <motion.div
            key={item.step}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeUp}
            className="relative text-center"
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border-4 border-background bg-navy font-heading text-lg font-bold text-white shadow-lg">
              {item.step}
            </div>
            <h3 className="mt-4 font-heading font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm text-foreground/60">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </Container>
  );
}
