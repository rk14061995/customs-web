import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string | Date, timeZone?: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatCurrency(amount: number, currency: string = "INR") {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

/**
 * Date + time. In the browser this naturally renders in the viewer's own
 * local timezone (no timeZone passed = runtime default). Pass an explicit
 * timeZone when formatting server-side (e.g. generating a PDF) where there
 * is no "local" timezone to fall back to.
 */
export function formatDateTime(date: string | Date, timeZone?: string) {
  const formatted = new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  });
  return timeZone ? `${formatted} (${timeZone})` : formatted;
}
