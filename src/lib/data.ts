import type {
  Service,
  Testimonial,
  BlogPost,
  FaqItem,
  TeamMember,
  TrackingResult,
} from "@/types";

export const siteConfig = {
  name: "Rana Forwarder",
  tagline: "Delivering Trust Across Borders",
  url: "https://www.rana-forwarder.in",
  description:
    "Rana Forwarder is a premium global logistics and courier partner offering air freight, ocean freight, road transport, warehousing, and express delivery across 220+ countries.",
  phone: "+91 98919 55255",
  alternatePhone: "+91 82876 67403",
  whatsapp: "919891955255",
  email: "rana.forwarders@gmail.com",
  address: "RZ 39C1/6, Raj Nagar 1, Palam, New Delhi 110045",
  hours: "Mon – Sat: 9:00 AM – 7:00 PM",
  social: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com",
  },
};

export const stats = [
  { label: "Deliveries Completed", value: 150000, suffix: "+" },
  { label: "Years of Experience", value: 20, suffix: "+" },
  { label: "Countries Served", value: 220, suffix: "+" },
  { label: "Happy Clients", value: 35000, suffix: "+" },
];

export const services: Service[] = [
  {
    slug: "air-freight",
    title: "Air Freight",
    shortDescription: "Time-critical cargo delivered across continents in hours, not weeks.",
    description:
      "Our air freight network connects major hubs worldwide, giving you the fastest possible transit for urgent and high-value shipments. With priority handling and real-time visibility, your cargo moves with speed and certainty.",
    icon: "Plane",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "Next-flight-out priority options",
      "Real-time in-transit visibility",
      "Dedicated charter availability",
      "Temperature-controlled handling",
    ],
  },
  {
    slug: "ocean-freight",
    title: "Ocean Freight",
    shortDescription: "Cost-efficient FCL & LCL shipping backed by a trusted carrier network.",
    description:
      "Move high-volume cargo affordably with our ocean freight solutions. We manage full container load and less-than-container load shipments with reliable port-to-port and door-to-door service.",
    icon: "Ship",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "FCL & LCL options",
      "Global carrier alliances",
      "Port congestion monitoring",
      "Competitive freight rates",
    ],
  },
  {
    slug: "road-transport",
    title: "Road Transport",
    shortDescription: "Flexible, door-to-door ground transport for domestic and cross-border freight.",
    description:
      "Our road freight fleet delivers dependable last-mile and long-haul coverage, with GPS-tracked vehicles and flexible scheduling tailored to your supply chain.",
    icon: "Truck",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "GPS-tracked fleet",
      "Full truckload & part-load options",
      "Cross-border customs support",
      "Flexible pickup scheduling",
    ],
  },
  {
    slug: "warehousing",
    title: "Warehousing",
    shortDescription: "Secure, scalable storage with integrated inventory management.",
    description:
      "Our strategically located warehouses offer short and long-term storage, pick-and-pack fulfillment, and inventory management systems that plug directly into your operations.",
    icon: "Warehouse",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "Climate-controlled facilities",
      "24/7 CCTV & security",
      "Pick, pack & fulfillment",
      "Real-time inventory dashboard",
    ],
  },
  {
    slug: "customs-clearance",
    title: "Customs Clearance",
    shortDescription: "Seamless import & export compliance handled by licensed experts.",
    description:
      "Avoid delays and penalties with our customs brokerage team, who manage documentation, duty calculation, and regulatory compliance across every border we serve.",
    icon: "ClipboardCheck",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "Licensed customs brokers",
      "Duty & tax optimization",
      "Automated documentation",
      "Regulatory compliance monitoring",
    ],
  },
  {
    slug: "express-delivery",
    title: "Express Delivery",
    shortDescription: "Same-day and next-day delivery for time-sensitive parcels.",
    description:
      "When speed matters most, our express network guarantees rapid pickup and delivery with live tracking, ideal for documents, samples, and urgent parcels.",
    icon: "Zap",
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "Same-day metro delivery",
      "Live GPS parcel tracking",
      "Signature-on-delivery proof",
      "Guaranteed delivery windows",
    ],
  },
  {
    slug: "international-courier",
    title: "International Courier",
    shortDescription: "Door-to-door parcel delivery to 220+ countries and territories.",
    description:
      "Send documents and parcels worldwide with confidence. Our international courier service combines competitive rates with dependable transit times and full tracking.",
    icon: "Globe2",
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "220+ country coverage",
      "Door-to-door service",
      "Transparent customs handling",
      "Insured shipments",
    ],
  },
  {
    slug: "domestic-courier",
    title: "Domestic Courier",
    shortDescription: "Reliable nationwide parcel and cargo delivery, city to city.",
    description:
      "Our domestic network reaches every major city and town, offering flexible service levels for individuals and businesses shipping within the country.",
    icon: "MapPin",
    image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "Pan-national coverage",
      "Next-day metro delivery",
      "Cash-on-delivery support",
      "Bulk shipping discounts",
    ],
  },
  {
    slug: "cargo-insurance",
    title: "Cargo Insurance",
    shortDescription: "Comprehensive coverage that protects your shipment's full value.",
    description:
      "Ship with peace of mind. Our cargo insurance plans cover loss, theft, and damage across air, ocean, and road freight, with fast, transparent claims processing.",
    icon: "ShieldCheck",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "Full-value cargo coverage",
      "Fast claims processing",
      "All-mode protection",
      "Flexible policy terms",
    ],
  },
  {
    slug: "import-export",
    title: "Import & Export",
    shortDescription: "End-to-end trade logistics for growing global businesses.",
    description:
      "From sourcing to final-mile delivery, we manage the full import/export lifecycle, including documentation, freight booking, and compliance across multiple jurisdictions.",
    icon: "ArrowLeftRight",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=1200&auto=format&fit=crop",
    benefits: [
      "End-to-end trade management",
      "Multi-country compliance",
      "Vendor & carrier coordination",
      "Trade finance guidance",
    ],
  },
];

export const whyChooseUs = [
  { icon: "Zap", title: "Fast Delivery", description: "Optimized routing gets your cargo where it needs to be, faster." },
  { icon: "PackageCheck", title: "Secure Packaging", description: "Industry-grade packaging standards protect every shipment." },
  { icon: "Radar", title: "Live Tracking", description: "Track every shipment in real time from pickup to delivery." },
  { icon: "BadgeDollarSign", title: "Affordable Pricing", description: "Transparent, competitive rates with no hidden fees." },
  { icon: "Headset", title: "Dedicated Support", description: "A dedicated account team is always a call away." },
  { icon: "Globe", title: "Global Network", description: "Reach 220+ countries through our trusted partner network." },
];

export const howItWorks = [
  { step: "01", title: "Pickup", description: "We collect your shipment from your doorstep at a scheduled time." },
  { step: "02", title: "Packaging", description: "Cargo is inspected, packaged, and labeled to industry standards." },
  { step: "03", title: "Shipping", description: "Your shipment moves via air, ocean, or road through our network." },
  { step: "04", title: "Customs Clearance", description: "Licensed brokers handle documentation and compliance." },
  { step: "05", title: "Delivery", description: "Final-mile delivery to the recipient with proof of delivery." },
];

export const testimonials: Testimonial[] = [
  {
    _id: "t1",
    name: "Amelia Carter",
    company: "Northbridge Retail Co.",
    role: "Supply Chain Manager",
    quote:
      "Rana Forwarder transformed how we handle international shipping. Transit times dropped and visibility into our cargo has never been better.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    _id: "t2",
    name: "Daniel Osei",
    company: "Vertex Manufacturing",
    role: "Operations Director",
    quote:
      "The team's customs expertise saved us from costly delays more than once. Genuinely reliable partners for cross-border freight.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    _id: "t3",
    name: "Elsa",
    company: "Lumen Exports",
    role: "Founder",
    quote:
      "From quote to delivery, everything is transparent. Live tracking and responsive support make Rana Forwarder our default choice.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=45",
  },
  {
    _id: "t4",
    name: "Marco Silva",
    company: "Silva & Co. Trading",
    role: "Logistics Lead",
    quote:
      "Warehousing and fulfillment under one roof simplified our entire operation. Highly recommend their integrated services.",
    rating: 4,
    avatar: "https://i.pravatar.cc/150?img=51",
  },
];

export const teamMembers: TeamMember[] = [
  {
    name: "Vikram Rana",
    role: "Founder & CEO",
    image: "https://i.pravatar.cc/300?img=13",
    bio: "20+ years building global logistics networks across five continents.",
  },
  {
    name: "Elena Marquez",
    role: "Chief Operations Officer",
    image: "https://i.pravatar.cc/300?img=47",
    bio: "Oversees daily operations across air, ocean, and road divisions.",
  },
  {
    name: "James Whitfield",
    role: "Head of Customs & Compliance",
    image: "https://i.pravatar.cc/300?img=15",
    bio: "Licensed customs broker with expertise in multi-jurisdiction trade law.",
  },
  {
    name: "Sara Kim",
    role: "Head of Customer Success",
    image: "https://i.pravatar.cc/300?img=48",
    bio: "Leads the support team dedicated to client satisfaction worldwide.",
  },
];

export const companyTimeline = [
  { year: "2005", title: "Company Founded", description: "Rana Forwarder began as a domestic courier service with a single office." },
  { year: "2010", title: "International Expansion", description: "Launched international courier and freight forwarding services." },
  { year: "2014", title: "Warehousing Network", description: "Opened our first regional fulfillment and warehousing center." },
  { year: "2018", title: "220+ Countries", description: "Extended our delivery network to over 220 countries and territories." },
  { year: "2023", title: "Digital Transformation", description: "Introduced live tracking, online quotes, and a fully digital customer portal." },
  { year: "2026", title: "150K+ Deliveries", description: "Crossed 150,000 successful deliveries with a 35,000+ client base." },
];

export const faqs: FaqItem[] = [
  {
    category: "Shipping",
    question: "How long does international shipping take?",
    answer: "Transit times vary by mode and destination: air freight typically takes 3–7 days, ocean freight 15–40 days, and express courier 1–3 days for most major routes.",
  },
  {
    category: "Shipping",
    question: "Do you offer door-to-door delivery?",
    answer: "Yes, all our service tiers include door-to-door options, from pickup at your location to final delivery at the recipient's address.",
  },
  {
    category: "Tracking",
    question: "How do I track my shipment?",
    answer: "Use the Track Shipment page and enter your tracking number to view real-time status updates and delivery milestones.",
  },
  {
    category: "Pricing",
    question: "How is shipping cost calculated?",
    answer: "Pricing depends on weight, dimensions, shipment type, origin, and destination. Use our Get Quote page for an instant estimate.",
  },
  {
    category: "Pricing",
    question: "Are there any hidden fees?",
    answer: "No. All quotes are transparent and include applicable customs, handling, and delivery charges upfront.",
  },
  {
    category: "Customs",
    question: "Do you handle customs clearance?",
    answer: "Yes, our licensed customs brokers manage documentation, duty calculation, and compliance for all international shipments.",
  },
  {
    category: "Account",
    question: "Can I ship as a business account holder?",
    answer: "Yes, business accounts get access to bulk shipping discounts, dedicated support, and consolidated invoicing.",
  },
  {
    category: "Insurance",
    question: "Is my shipment insured?",
    answer: "Cargo insurance is available on all shipments and covers loss, theft, and damage up to the declared value.",
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "future-of-global-freight",
    title: "The Future of Global Freight: Trends to Watch in 2026",
    excerpt: "From digital freight matching to green shipping corridors, here's what's shaping the industry.",
    content:
      "The logistics industry is undergoing rapid transformation. Digital freight matching platforms are reducing empty miles, while green shipping corridors are cutting emissions across major trade routes. In this article, we explore the key trends reshaping global freight in 2026, including automation in warehousing, predictive customs clearance, and the rise of real-time supply chain visibility tools that give shippers unprecedented control over their cargo.",
    category: "Industry Insights",
    author: "Elena Marquez",
    date: "2026-06-02",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop",
    readTime: "5 min read",
  },
  {
    slug: "choosing-air-vs-ocean-freight",
    title: "Air Freight vs. Ocean Freight: Which Is Right for Your Business?",
    excerpt: "A practical breakdown of cost, speed, and volume trade-offs to guide your shipping decision.",
    content:
      "Choosing between air and ocean freight comes down to balancing speed against cost. Air freight offers unmatched transit times, ideal for high-value or time-critical goods, while ocean freight remains the most economical option for bulk shipments. This guide walks through the key factors — cargo value, urgency, volume, and destination infrastructure — to help you decide which mode fits your supply chain.",
    category: "Guides",
    author: "James Whitfield",
    date: "2026-05-18",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=1200&auto=format&fit=crop",
    readTime: "6 min read",
  },
  {
    slug: "customs-clearance-checklist",
    title: "A Complete Customs Clearance Checklist for Exporters",
    excerpt: "Avoid costly delays with this step-by-step guide to preparing export documentation.",
    content:
      "Customs delays are one of the most common causes of shipment disruption. This checklist covers everything exporters need: commercial invoices, packing lists, certificates of origin, and HS code classification. We also cover common mistakes that trigger customs holds and how a licensed broker can streamline the entire clearance process.",
    category: "Guides",
    author: "James Whitfield",
    date: "2026-04-27",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?q=80&w=1200&auto=format&fit=crop",
    readTime: "4 min read",
  },
  {
    slug: "warehousing-fulfillment-tips",
    title: "5 Ways Smart Warehousing Improves Order Fulfillment",
    excerpt: "How integrated inventory systems and strategic warehouse locations speed up delivery.",
    content:
      "Modern warehousing goes far beyond storage. Integrated inventory management, strategic facility placement, and pick-and-pack automation all contribute to faster order fulfillment. This article covers five practical strategies businesses can use to optimize their warehousing operations and reduce last-mile delivery times.",
    category: "Operations",
    author: "Sara Kim",
    date: "2026-03-14",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    readTime: "5 min read",
  },
];

export const trackingDatabase: Record<string, TrackingResult> = {
  RF1234567890: {
    trackingNumber: "RF1234567890",
    status: "In Transit",
    origin: "Metro City, USA",
    destination: "London, UK",
    estimatedDelivery: "2026-07-25",
    events: [
      { status: "Booked", location: "Metro City, USA", date: "2026-07-18", completed: true },
      { status: "Picked Up", location: "Metro City, USA", date: "2026-07-19", completed: true },
      { status: "In Transit", location: "Frankfurt, DE", date: "2026-07-20", completed: true },
      { status: "Customs Clearance", location: "London, UK", date: "2026-07-23", completed: false },
      { status: "Out For Delivery", location: "London, UK", date: "2026-07-24", completed: false },
      { status: "Delivered", location: "London, UK", date: "2026-07-25", completed: false },
    ],
  },
  RF2001334455: {
    trackingNumber: "RF2001334455",
    status: "Booked",
    origin: "Metro City, USA",
    destination: "Dubai, UAE",
    estimatedDelivery: "2026-07-30",
    events: [
      { status: "Booked", location: "Metro City, USA", date: "2026-07-20", completed: true },
      { status: "Picked Up", location: "Metro City, USA", date: "2026-07-21", completed: false },
      { status: "In Transit", location: "Doha, QA", date: "2026-07-24", completed: false },
      { status: "Customs Clearance", location: "Dubai, UAE", date: "2026-07-28", completed: false },
      { status: "Out For Delivery", location: "Dubai, UAE", date: "2026-07-29", completed: false },
      { status: "Delivered", location: "Dubai, UAE", date: "2026-07-30", completed: false },
    ],
  },
  RF3006677889: {
    trackingNumber: "RF3006677889",
    status: "Picked Up",
    origin: "Chicago, USA",
    destination: "Toronto, Canada",
    estimatedDelivery: "2026-07-23",
    events: [
      { status: "Booked", location: "Chicago, USA", date: "2026-07-18", completed: true },
      { status: "Picked Up", location: "Chicago, USA", date: "2026-07-19", completed: true },
      { status: "In Transit", location: "Detroit, USA", date: "2026-07-21", completed: false },
      { status: "Customs Clearance", location: "Toronto, Canada", date: "2026-07-22", completed: false },
      { status: "Out For Delivery", location: "Toronto, Canada", date: "2026-07-23", completed: false },
      { status: "Delivered", location: "Toronto, Canada", date: "2026-07-23", completed: false },
    ],
  },
  RF4009988776: {
    trackingNumber: "RF4009988776",
    status: "Customs Clearance",
    origin: "Mumbai, India",
    destination: "Singapore",
    estimatedDelivery: "2026-07-22",
    events: [
      { status: "Booked", location: "Mumbai, India", date: "2026-07-15", completed: true },
      { status: "Picked Up", location: "Mumbai, India", date: "2026-07-16", completed: true },
      { status: "In Transit", location: "Colombo, LK", date: "2026-07-18", completed: true },
      { status: "Customs Clearance", location: "Singapore", date: "2026-07-20", completed: true },
      { status: "Out For Delivery", location: "Singapore", date: "2026-07-21", completed: false },
      { status: "Delivered", location: "Singapore", date: "2026-07-22", completed: false },
    ],
  },
  RF5001122334: {
    trackingNumber: "RF5001122334",
    status: "Out For Delivery",
    origin: "Berlin, Germany",
    destination: "Paris, France",
    estimatedDelivery: "2026-07-20",
    events: [
      { status: "Booked", location: "Berlin, Germany", date: "2026-07-16", completed: true },
      { status: "Picked Up", location: "Berlin, Germany", date: "2026-07-17", completed: true },
      { status: "In Transit", location: "Frankfurt, DE", date: "2026-07-18", completed: true },
      { status: "Customs Clearance", location: "Paris, France", date: "2026-07-19", completed: true },
      { status: "Out For Delivery", location: "Paris, France", date: "2026-07-20", completed: true },
      { status: "Delivered", location: "Paris, France", date: "2026-07-20", completed: false },
    ],
  },
  RF6003344556: {
    trackingNumber: "RF6003344556",
    status: "Delivered",
    origin: "Sydney, Australia",
    destination: "Auckland, New Zealand",
    estimatedDelivery: "2026-07-15",
    events: [
      { status: "Booked", location: "Sydney, Australia", date: "2026-07-10", completed: true },
      { status: "Picked Up", location: "Sydney, Australia", date: "2026-07-11", completed: true },
      { status: "In Transit", location: "Tasman Sea", date: "2026-07-12", completed: true },
      { status: "Customs Clearance", location: "Auckland, New Zealand", date: "2026-07-13", completed: true },
      { status: "Out For Delivery", location: "Auckland, New Zealand", date: "2026-07-14", completed: true },
      { status: "Delivered", location: "Auckland, New Zealand", date: "2026-07-15", completed: true },
    ],
  },
};
