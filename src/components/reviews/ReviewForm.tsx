"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Building2, MessageSquare, Star, Send, CheckCircle2, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { reviewSchema, type ReviewFormValues } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy";

export default function ReviewForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0 } });

  const rating = watch("rating");

  const onSubmit = async (data: ReviewFormValues) => {
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong submitting your review. Please try again.");
    }
  };

  if (submitted) {
    return (
      <Card hover={false} className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-orange" />
        <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">Thank You!</h2>
        <p className="mt-2 text-foreground/60">
          Your review has been submitted and will appear on our site once it&apos;s approved by our team.
        </p>
      </Card>
    );
  }

  return (
    <Card hover={false}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Your Rating</label>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const filled = value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`Rate ${value} out of 5`}
                  onClick={() => setValue("rating", value, { shouldValidate: true })}
                  className="p-0.5"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      filled ? "fill-orange text-orange" : "text-foreground/25"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating.message}</p>}
        </div>

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
            <p className="mt-1 text-xs text-foreground/40">Only used to follow up — never shown publicly.</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Building2 className="size-3.5 text-foreground/50" /> Company{" "}
            <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <input {...register("company")} placeholder="Your company name" className={inputClass} />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <MessageSquare className="size-3.5 text-foreground/50" /> Your Review
          </label>
          <textarea
            {...register("quote")}
            rows={5}
            placeholder="Tell us about your experience shipping with us..."
            className={inputClass}
          />
          {errors.quote && <p className="mt-1 text-xs text-red-500">{errors.quote.message}</p>}
        </div>

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <Button type="submit" disabled={isSubmitting} icon={isSubmitting ? undefined : Send} className="w-full sm:w-auto">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Review"}
        </Button>
      </form>
    </Card>
  );
}
