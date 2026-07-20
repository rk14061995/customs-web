"use client";

import { motion } from "framer-motion";
import {
  Zap,
  PackageCheck,
  Radar,
  BadgeDollarSign,
  Headset,
  Globe,
} from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { whyChooseUs } from "@/lib/data";
import { fadeUp, viewportOnce } from "@/lib/motion";

const icons = { Zap, PackageCheck, Radar, BadgeDollarSign, Headset, Globe };

export default function WhyChooseUs() {
  return (
    <div className="bg-surface">
      <Container className="py-16 md:py-24">
        <SectionHeading
          eyebrow="Why Rana Forwarder"
          title="Built for Businesses That Can't Afford Delays"
          description="We combine speed, security, and transparency so you can focus on growing your business."
        />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item, i) => {
            const Icon = icons[item.icon as keyof typeof icons];
            return (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                variants={fadeUp}
                className="flex gap-4"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                  <Icon className="size-6" />
                </span>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-foreground/60">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
