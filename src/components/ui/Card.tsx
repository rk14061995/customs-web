import { cn } from "@/lib/utils";

export default function Card({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border-subtle bg-background p-6 shadow-sm transition-all duration-300",
        hover && "hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10",
        className
      )}
    >
      {children}
    </div>
  );
}
