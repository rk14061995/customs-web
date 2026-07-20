import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetail from "@/components/services/ServiceDetail";
import { getServices, getServiceBySlug } from "@/lib/queries";

const SLUG = "warehousing";

export async function generateMetadata(): Promise<Metadata> {
  const service = await getServiceBySlug(SLUG);
  return {
    title: "Warehousing",
    description: service?.shortDescription,
    alternates: { canonical: "/warehousing" },
  };
}

export default async function WarehousingPage() {
  const service = await getServiceBySlug(SLUG);
  if (!service) notFound();
  const services = await getServices();
  const related = services.filter((s) => s.slug !== SLUG).slice(0, 3);
  return <ServiceDetail service={service} related={related} />;
}
