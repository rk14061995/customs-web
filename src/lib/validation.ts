import { z } from "zod";

export const quoteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.email("Enter a valid email address"),
  pickupLocation: z.string().min(2, "Pickup location is required"),
  destination: z.string().min(2, "Destination is required"),
  shipmentType: z.enum(["air", "ocean", "road", "express", "warehousing"]),
  weight: z.string().min(1, "Weight is required"),
  dimensions: z.string().optional(),
  pickupDate: z.string().min(1, "Expected pickup date is required"),
  message: z.string().optional(),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const reviewSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  company: z.string().optional(),
  rating: z.number().min(1, "Please select a rating").max(5),
  quote: z.string().min(10, "Please share a bit more detail (at least 10 characters)").max(1000),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
