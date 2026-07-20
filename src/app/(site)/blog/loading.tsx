import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";

export default function BlogLoading() {
  return (
    <Section>
      <Container>
        <div className="mb-10 h-10 w-64 animate-pulse rounded-full bg-surface" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-border-subtle">
              <div className="aspect-[16/10] animate-pulse bg-surface" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-24 animate-pulse rounded bg-surface" />
                <div className="h-5 w-full animate-pulse rounded bg-surface" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
