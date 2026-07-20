"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { getIcon } from "@/lib/icons";
import type { Service } from "@/types";

export default function ServicesGrid({ services }: { services: Service[] }) {
  return (
    <Container>
      <SectionHeading
        eyebrow="What We Offer"
        title="End-to-End Logistics Services"
        description="From first mile to last mile, we handle every step of your shipment's journey with precision and care."
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.slice(0, 6).map((service, i) => {
          const Icon = getIcon(service.icon);
          return (
            <motion.div key={service.slug} custom={i} initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUp}>
              <Link href={`/services/${service.slug}`}>
                <Card className="group h-full">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-navy/10 text-navy transition-colors group-hover:bg-orange group-hover:text-white dark:bg-white/10 dark:text-white">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 flex items-center justify-between font-heading text-lg font-semibold text-foreground">
                    {service.title}
                    <ArrowUpRight className="size-4 text-foreground/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange" />
                  </h3>
                  <p className="mt-2 text-sm text-foreground/60">{service.shortDescription}</p>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Container>
  );
}
