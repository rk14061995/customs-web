"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Testimonial } from "@/types";

export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const total = testimonials.length;

  if (total === 0) return null;

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const current = testimonials[index];

  return (
    <div className="bg-navy">
      <Container className="py-16 md:py-24">
        <SectionHeading
          eyebrow="Client Stories"
          title="Trusted by Businesses Worldwide"
          className="[&_h2]:text-white [&_p]:text-white/60"
        />
        <div className="relative mx-auto max-w-3xl">
          <Quote className="mx-auto size-10 text-orange/50" />
          <AnimatePresence mode="wait">
            <motion.div
              key={current._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="mt-6 text-center"
            >
              <p className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                &ldquo;{current.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center justify-center gap-1">
                {Array.from({ length: current.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-orange text-orange" />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Image
                  src={current.avatar}
                  alt={current.name}
                  width={48}
                  height={48}
                  className="size-12 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="font-heading text-sm font-semibold text-white">{current.name}</p>
                  <p className="text-xs text-white/50">
                    {current.role}, {current.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={prev}
              className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((t, i) => (
                <button
                  key={t._id}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-orange" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={next}
              className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
