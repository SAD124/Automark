import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("space-y-4 sm:space-y-5", align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary/80 sm:text-xs sm:tracking-[0.36em]">{eyebrow}</p>
      ) : null}
      <div className={cn("space-y-4", align === "center" ? "mx-auto max-w-3xl" : "max-w-2xl")}>
        <h2 className="font-heading text-[2rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-on-background sm:text-[2.75rem] md:text-5xl lg:text-6xl">
          {title}
        </h2>
        <div className={cn("intelligence-beam", align === "center" ? "mx-auto w-32" : "w-28")} />
        {description ? (
          <p className="text-[15px] leading-7 text-on-surface-variant sm:text-lg sm:leading-8">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
