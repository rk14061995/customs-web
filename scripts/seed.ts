import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import ServiceModel from "../src/models/Service";
import BlogModel from "../src/models/Blog";
import TestimonialModel from "../src/models/Testimonial";
import TeamModel from "../src/models/Team";
import FaqModel from "../src/models/Faq";
import HomepageModel from "../src/models/Homepage";
import SettingsModel from "../src/models/Settings";
import UserModel from "../src/models/User";
import CustomerModel from "../src/models/Customer";
import CarrierModel from "../src/models/Carrier";
import ShipmentModel from "../src/models/Shipment";
import PaymentModel from "../src/models/Payment";
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

const sampleCustomers = [
  { name: "Amelia Hart", company: "Hart Textiles", email: "amelia@harttextiles.com", phone: "+1 312 555 0110" },
  { name: "Noah Becker", company: "Becker Imports", email: "noah@beckerimports.de", phone: "+49 30 555 0122" },
  { name: "Priya Nair", company: "Nair Exports", email: "priya@nairexports.in", phone: "+91 98 555 01234" },
  { name: "Liam O'Connor", company: "O'Connor Freight Co.", email: "liam@oconnorfreight.ie", phone: "+353 1 555 0140" },
];

const sampleCarriers = [
  { name: "SkyBridge Air Cargo", contactPerson: "Frank Ade", phone: "+1 800 555 0199", serviceAreas: "International, Air", vehicleType: "Air", active: true },
  { name: "BlueWave Ocean Freight", contactPerson: "Nina Cole", phone: "+1 800 555 0177", serviceAreas: "International, Sea", vehicleType: "Sea", active: true },
  { name: "Metro Road Runners", contactPerson: "Sam Diaz", phone: "+1 800 555 0155", serviceAreas: "Domestic, Road", vehicleType: "Truck", active: true },
];

const serviceTypeByStatusKey = [
  "Air Freight",
  "International Courier",
  "Road Transport",
  "Ocean Freight",
  "Express Delivery",
];

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
    HomepageModel.deleteMany({}),
    SettingsModel.deleteMany({}),
    CustomerModel.deleteMany({}),
    CarrierModel.deleteMany({}),
    ShipmentModel.deleteMany({}),
    PaymentModel.deleteMany({}),
  ]);

  await ServiceModel.insertMany(services.map((s, i) => ({ ...s, order: i })));
  await BlogModel.insertMany(blogPosts.map((p) => ({ ...p, published: true })));
  await TestimonialModel.insertMany(
    testimonials.map(({ _id, ...t }) => ({ ...t, published: true }))
  );
  await TeamModel.insertMany(teamMembers.map((m, i) => ({ ...m, order: i })));
  await FaqModel.insertMany(faqs.map((f, i) => ({ ...f, order: i })));

  const customers = await CustomerModel.insertMany(sampleCustomers);
  const carriers = await CarrierModel.insertMany(sampleCarriers);

  const trackingEntries = Object.values(trackingDatabase);
  const shipments = await ShipmentModel.insertMany(
    trackingEntries.map((entry, i) => ({
      trackingNumber: entry.trackingNumber,
      customer: customers[i % customers.length]._id,
      carrier: carriers[i % carriers.length]._id,
      serviceType: serviceTypeByStatusKey[i % serviceTypeByStatusKey.length],
      origin: entry.origin,
      destination: entry.destination,
      weight: `${20 + i * 5} kg`,
      dimensions: "40x30x25 cm",
      packages: 1 + (i % 3),
      status: entry.status,
      estimatedDelivery: entry.estimatedDelivery,
      events: entry.events,
      cost: 15000 + i * 3500,
      currency: "INR",
      notes: "Seeded sample shipment.",
    }))
  );

  await Promise.all(
    shipments.map((shipment, i) => {
      const isDelivered = shipment.status === "Delivered";
      const isPartial = i % 3 === 0 && !isDelivered;
      const amount = isPartial ? Math.round(shipment.cost * 0.5) : shipment.cost;
      return PaymentModel.create({
        shipment: shipment._id,
        invoiceNumber: `INV-SEED-${1000 + i}`,
        amount,
        currency: shipment.currency,
        method: ["Bank Transfer", "Card", "UPI", "Cash"][i % 4],
        status: isDelivered ? "paid" : isPartial ? "paid" : "pending",
        paidAt: isDelivered || isPartial ? new Date().toISOString().slice(0, 10) : undefined,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      }).then(async () => {
        const paid = await PaymentModel.find({ shipment: shipment._id, status: "paid" }).lean();
        const paidTotal = paid.reduce((sum, p) => sum + p.amount, 0);
        shipment.paymentStatus = paidTotal >= shipment.cost ? "paid" : paidTotal > 0 ? "partial" : "unpaid";
        await shipment.save();
      });
    })
  );

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
    alternatePhone: siteConfig.alternatePhone,
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
