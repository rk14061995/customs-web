"use client";

import { useState } from "react";
import { MessageSquareText, X, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Open live chat"
        onClick={() => setOpen((v) => !v)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 left-6 z-40 flex size-14 items-center justify-center rounded-full bg-navy text-white shadow-lg shadow-navy/40"
      >
        {open ? <X className="size-6" /> : <MessageSquareText className="size-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 left-6 z-40 w-80 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-border-subtle bg-background shadow-2xl"
          >
            <div className="bg-navy px-5 py-4 text-white">
              <p className="font-heading text-sm font-semibold">Live Chat</p>
              <p className="text-xs text-white/60">We typically reply within a few minutes</p>
            </div>
            <div className="space-y-3 p-5">
              <p className="rounded-2xl rounded-tl-none bg-surface px-4 py-2.5 text-sm text-foreground/70">
                👋 Hi! Live chat is coming soon. For now, reach us via WhatsApp or the contact form and we&apos;ll respond right away.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-border-subtle p-3">
              <input
                disabled
                placeholder="Live chat coming soon..."
                className="w-full rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm text-foreground/40 outline-none"
              />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy/30 text-white">
                <Send className="size-4" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
