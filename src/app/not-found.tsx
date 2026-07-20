import { PackageX } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center py-20">
      <Container className="text-center">
        <PackageX className="mx-auto size-16 text-orange" />
        <h1 className="mt-6 font-heading text-5xl font-bold text-foreground sm:text-6xl">404</h1>
        <p className="mt-3 text-lg text-foreground/60">
          Looks like this shipment got lost in transit. The page you&apos;re
          looking for doesn&apos;t exist.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/">Back to Home</Button>
          <Button href="/contact" variant="ghost">Contact Support</Button>
        </div>
      </Container>
    </section>
  );
}
