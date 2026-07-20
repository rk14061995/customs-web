import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";

export default function ServicesLoading() {
  return (
    <Section>
      <Container>
        <div className="mb-10 h-10 w-64 animate-pulse rounded-full bg-surface" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-border-subtle">
              <div className="aspect-[16/10] animate-pulse bg-surface" />
              <div className="space-y-3 p-6">
                <div className="h-5 w-1/2 animate-pulse rounded bg-surface" />
                <div className="h-4 w-full animate-pulse rounded bg-surface" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
