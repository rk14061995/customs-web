import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

const variants = {
  primary:
    "bg-orange text-white hover:bg-orange-dark shadow-lg shadow-orange/25 hover:shadow-orange/40",
  secondary:
    "bg-navy text-white hover:bg-navy-dark shadow-lg shadow-navy/25 hover:shadow-navy/40",
  outline:
    "border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm",
  ghost: "text-navy dark:text-white hover:bg-navy/5 dark:hover:bg-white/10",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-base",
};

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "right",
  className,
  type = "button",
  disabled,
}: ButtonProps) {
  const classes = cn(
    "group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className
  );

  const content = (
    <>
      {Icon && iconPosition === "left" && (
        <Icon className="size-4 transition-transform group-hover:-translate-x-0.5" />
      )}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon className="size-4 transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled}>
      {content}
    </button>
  );
}
