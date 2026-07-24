import dbConnect from "@/lib/dbConnect";
import ServiceModel from "@/models/Service";
import BlogModel from "@/models/Blog";
import TestimonialModel from "@/models/Testimonial";
import TeamModel from "@/models/Team";
import FaqModel from "@/models/Faq";
import HomepageModel from "@/models/Homepage";
import SettingsModel from "@/models/Settings";
import QuoteModel from "@/models/Quote";
import ContactModel from "@/models/Contact";
import ShipmentModel from "@/models/Shipment";
import PaymentModel from "@/models/Payment";
import "@/models/Customer";
import type { Service, BlogPost, Testimonial, TeamMember, FaqItem } from "@/types";

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getServices(): Promise<Service[]> {
  await dbConnect();
  const docs = await ServiceModel.find().sort({ order: 1 }).lean();
  return serialize(docs);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  await dbConnect();
  const doc = await ServiceModel.findOne({ slug }).lean();
  return doc ? serialize(doc) : null;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  await dbConnect();
  const docs = await BlogModel.find({ published: true }).sort({ createdAt: -1 }).lean();
  return serialize(docs);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  await dbConnect();
  const doc = await BlogModel.findOne({ slug, published: true }).lean();
  return doc ? serialize(doc) : null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  await dbConnect();
  const docs = await TestimonialModel.find({ published: true }).lean();
  return serialize(docs);
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  await dbConnect();
  const docs = await TeamModel.find().sort({ order: 1 }).lean();
  return serialize(docs);
}

export async function getFaqs(): Promise<FaqItem[]> {
  await dbConnect();
  const docs = await FaqModel.find().sort({ order: 1 }).lean();
  return serialize(docs);
}

export async function getHomepageContent() {
  await dbConnect();
  const doc = await HomepageModel.findOne().lean();
  return serialize<{
    heroHeadline: string;
    heroSubtitle: string;
    stats: { label: string; value: number; suffix: string }[];
  } | null>(doc);
}

export async function getAdminStats() {
  await dbConnect();
  const [
    quoteCount,
    contactCount,
    blogCount,
    serviceCount,
    testimonialCount,
    newQuoteCount,
    newContactCount,
    recentQuotes,
    recentContacts,
    shipmentCount,
    activeShipmentCount,
    recentShipments,
    paidAgg,
    pendingAgg,
  ] = await Promise.all([
    QuoteModel.countDocuments(),
    ContactModel.countDocuments(),
    BlogModel.countDocuments(),
    ServiceModel.countDocuments(),
    TestimonialModel.countDocuments(),
    QuoteModel.countDocuments({ status: "new" }),
    ContactModel.countDocuments({ status: "new" }),
    QuoteModel.find().sort({ createdAt: -1 }).limit(5).lean(),
    ContactModel.find().sort({ createdAt: -1 }).limit(5).lean(),
    ShipmentModel.countDocuments(),
    ShipmentModel.countDocuments({ status: { $nin: ["Delivered", "Cancelled"] } }),
    ShipmentModel.find().sort({ createdAt: -1 }).limit(5).populate("customer", "name company").lean(),
    PaymentModel.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PaymentModel.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return serialize<{
    quoteCount: number;
    contactCount: number;
    blogCount: number;
    serviceCount: number;
    testimonialCount: number;
    newQuoteCount: number;
    newContactCount: number;
    recentQuotes: Array<Record<string, unknown>>;
    recentContacts: Array<Record<string, unknown>>;
    shipmentCount: number;
    activeShipmentCount: number;
    recentShipments: Array<Record<string, unknown>>;
    totalRevenue: number;
    pendingRevenue: number;
  }>({
    quoteCount,
    contactCount,
    blogCount,
    serviceCount,
    testimonialCount,
    newQuoteCount,
    newContactCount,
    recentQuotes,
    recentContacts,
    shipmentCount,
    activeShipmentCount,
    recentShipments,
    totalRevenue: paidAgg[0]?.total ?? 0,
    pendingRevenue: pendingAgg[0]?.total ?? 0,
  });
}

export async function getSettings() {
  await dbConnect();
  const doc = await SettingsModel.findOne().lean();
  return serialize<{
    siteName: string;
    tagline: string;
    phone: string;
    alternatePhone?: string;
    whatsapp: string;
    email: string;
    address: string;
    hours: string;
    social: { facebook?: string; twitter?: string; linkedin?: string; instagram?: string };
  } | null>(doc);
}
