"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Phone, Tag, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { contactSchema, type ContactFormValues } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactFormValues) => {
    setSubmitError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong sending your message. Please try again.");
    }
  };

  if (submitted) {
    return (
      <Card hover={false} className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-orange" />
        <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">Message Sent</h2>
        <p className="mt-2 text-foreground/60">
          Thanks for reaching out. Our support team will get back to you within one business day.
        </p>
      </Card>
    );
  }

  return (
    <Card hover={false}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <User className="size-3.5 text-foreground/50" /> Full Name
            </label>
            <input {...register("name")} placeholder="John Doe" className={inputClass} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Mail className="size-3.5 text-foreground/50" /> Email
            </label>
            <input {...register("email")} type="email" placeholder="you@company.com" className={inputClass} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Phone className="size-3.5 text-foreground/50" /> Phone
            </label>
            <input {...register("phone")} placeholder="+1 555 000 0000" className={inputClass} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Tag className="size-3.5 text-foreground/50" /> Subject
            </label>
            <input {...register("subject")} placeholder="How can we help?" className={inputClass} />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>}
          </div>
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <MessageSquare className="size-3.5 text-foreground/50" /> Message
          </label>
          <textarea {...register("message")} rows={5} placeholder="Tell us more about your enquiry..." className={inputClass} />
          {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
        </div>
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} icon={isSubmitting ? undefined : Send} className="w-full sm:w-auto">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Send Message"}
        </Button>
      </form>
    </Card>
  );
}
