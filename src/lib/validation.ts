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

export const customerSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  email: z.email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CustomerSignupFormValues = z.infer<typeof customerSignupSchema>;

export const customerLoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const customerPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type CustomerPasswordChangeFormValues = z.infer<typeof customerPasswordChangeSchema>;

export const customerProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  phone: z.string().min(7, "Enter a valid phone number"),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  stateName: z.string().optional(),
  stateCode: z.string().optional(),
});

export type CustomerProfileFormValues = z.infer<typeof customerProfileSchema>;

// Booking requests reuse the public quote fields, minus name/email/phone which
// come from the logged-in customer's session/profile instead of a form field.
export const bookingRequestSchema = quoteSchema.omit({ name: true, email: true, phone: true });

export type BookingRequestFormValues = z.infer<typeof bookingRequestSchema>;

export const walletTopupSchema = z.object({
  amount: z.number().min(100, "Minimum top-up is ₹100").max(500000, "Maximum top-up is ₹5,00,000"),
});
