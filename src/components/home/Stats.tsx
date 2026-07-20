"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { fadeUp, viewportOnce } from "@/lib/motion";

type StatItem = { label: string; value: number; suffix: string };

export default function Stats({ stats }: { stats: StatItem[] }) {
  return (
    <section className="relative -mt-12 z-10">
      <Container>
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border-subtle bg-background p-6 shadow-xl shadow-navy/5 sm:grid-cols-4 sm:p-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={fadeUp}
              className="text-center"
            >
              <div className="font-heading text-3xl font-bold text-navy dark:text-white sm:text-4xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-1 text-sm text-foreground/60">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
