import { Truck } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-14 animate-pulse items-center justify-center rounded-2xl bg-navy text-white">
          <Truck className="size-7" />
        </span>
        <span className="text-sm font-medium text-foreground/50">Loading...</span>
      </div>
    </div>
  );
}
