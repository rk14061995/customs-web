"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/types";

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [category, setCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(faqs.map((f) => f.category)))],
    [faqs]
  );

  const filtered = useMemo(
    () => faqs.filter((f) => category === "All" || f.category === category),
    [faqs, category]
  );

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setOpenIndex(0);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === c ? "bg-navy text-white" : "bg-surface text-foreground/60 hover:bg-navy/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-3xl divide-y divide-border-subtle rounded-3xl border border-border-subtle">
        {filtered.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div key={faq.question}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-medium text-foreground">{faq.question}</span>
                <ChevronDown className={`size-4 shrink-0 text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-foreground/60">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
