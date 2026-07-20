import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "navy",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "navy" | "orange";
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-background p-5">
      <div className="flex items-center justify-between">
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${
            accent === "orange" ? "bg-orange/10 text-orange" : "bg-navy/10 text-navy"
          }`}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 font-heading text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-foreground/60">{label}</p>
    </div>
  );
}
