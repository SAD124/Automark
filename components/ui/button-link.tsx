import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  target?: string;
  rel?: string;
};

const variantClasses: Record<NonNullable<ButtonLinkProps["variant"]>, string> = {
  primary:
    "bg-linear-to-r from-primary to-primary-container text-on-primary shadow-[0_0_30px_rgba(79,219,200,0.18)] hover:shadow-[0_0_38px_rgba(79,219,200,0.24)]",
  secondary:
    "border border-primary/80 bg-transparent text-primary hover:bg-primary/8 hover:shadow-[0_0_20px_rgba(79,219,200,0.18)]",
  ghost: "bg-transparent text-on-background hover:text-primary",
};

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
  target,
  rel,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 font-semibold tracking-[-0.03em] sm:min-h-14 sm:px-8",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
