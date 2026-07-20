import {
  Plane,
  Ship,
  Truck,
  Warehouse,
  ClipboardCheck,
  Zap,
  Globe2,
  MapPin,
  ShieldCheck,
  ArrowLeftRight,
  PackageCheck,
  Radar,
  BadgeDollarSign,
  Headset,
  Globe,
  type LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Plane,
  Ship,
  Truck,
  Warehouse,
  ClipboardCheck,
  Zap,
  Globe2,
  MapPin,
  ShieldCheck,
  ArrowLeftRight,
  PackageCheck,
  Radar,
  BadgeDollarSign,
  Headset,
  Globe,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Plane;
}
