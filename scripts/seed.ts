import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import ServiceModel from "../src/models/Service";
import BlogModel from "../src/models/Blog";
import TestimonialModel from "../src/models/Testimonial";
import TeamModel from "../src/models/Team";
import FaqModel from "../src/models/Faq";
import TrackingModel from "../src/models/Tracking";
import HomepageModel from "../src/models/Homepage";
import SettingsModel from "../src/models/Settings";
import UserModel from "../src/models/User";
import {
  services,
  blogPosts,
  testimonials,
  teamMembers,
  faqs,
  trackingDatabase,
  stats,
  siteConfig,
} from "../src/lib/data";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  await Promise.all([
    ServiceModel.deleteMany({}),
    BlogModel.deleteMany({}),
    TestimonialModel.deleteMany({}),
    TeamModel.deleteMany({}),
    FaqModel.deleteMany({}),
    TrackingModel.deleteMany({}),
    HomepageModel.deleteMany({}),
    SettingsModel.deleteMany({}),
  ]);

  await ServiceModel.insertMany(services.map((s, i) => ({ ...s, order: i })));
  await BlogModel.insertMany(blogPosts.map((p) => ({ ...p, published: true })));
  await TestimonialModel.insertMany(
    testimonials.map(({ _id, ...t }) => ({ ...t, published: true }))
  );
  await TeamModel.insertMany(teamMembers.map((m, i) => ({ ...m, order: i })));
  await FaqModel.insertMany(faqs.map((f, i) => ({ ...f, order: i })));
  await TrackingModel.insertMany(Object.values(trackingDatabase));
  await HomepageModel.create({
    heroHeadline: "Reliable Global Logistics Solutions",
    heroSubtitle:
      "Air, ocean, and road freight backed by real-time tracking, customs expertise, and a dedicated support team.",
    stats,
  });
  await SettingsModel.create({
    siteName: siteConfig.name,
    tagline: siteConfig.tagline,
    phone: siteConfig.phone,
    whatsapp: siteConfig.whatsapp,
    email: siteConfig.email,
    address: siteConfig.address,
    hours: siteConfig.hours,
    social: siteConfig.social,
  });

  const existingAdmin = await UserModel.findOne({ email: "admin@ranaforwarder.com" });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    await UserModel.create({
      name: "Admin",
      email: "admin@ranaforwarder.com",
      passwordHash,
      role: "admin",
    });
    console.log("Created default admin user: admin@ranaforwarder.com / ChangeMe123!");
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
