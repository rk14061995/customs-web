export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: string;
  image: string;
  benefits: string[];
}

export interface Testimonial {
  _id: string;
  name: string;
  company: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

export interface TrackingEvent {
  status: string;
  location: string;
  date: string;
  completed: boolean;
}

export interface TrackingResult {
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  events: TrackingEvent[];
  /** Only present for shipments we manage ourselves; absent for external/universal lookups. */
  serviceType?: string;
  carrier?: string;
  weight?: string;
  dimensions?: string;
  packages?: number;
}

export type QuoteFormData = {
  name: string;
  company?: string;
  phone: string;
  email: string;
  pickupLocation: string;
  destination: string;
  shipmentType: string;
  weight: string;
  dimensions?: string;
  pickupDate: string;
  message?: string;
};

export type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};
