"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "rf-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-border-subtle bg-background/95 p-5 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 size-5 shrink-0 text-orange" />
            <p className="text-sm text-foreground/70">
              We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our{" "}
              <Link href="/privacy-policy" className="font-medium text-navy underline dark:text-white">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <Button size="sm" onClick={accept} className="shrink-0">
            Accept
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
