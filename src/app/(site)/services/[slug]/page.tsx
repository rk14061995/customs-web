import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetail from "@/components/services/ServiceDetail";
import { getServices, getServiceBySlug } from "@/lib/queries";

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.shortDescription,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const services = await getServices();
  const related = services.filter((s) => s.slug !== slug).slice(0, 3);

  return <ServiceDetail service={service} related={related} />;
}
