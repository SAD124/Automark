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
    <div className={cn("space-y-5", align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-primary/80">{eyebrow}</p>
      ) : null}
      <div className={cn("space-y-4", align === "center" ? "mx-auto max-w-3xl" : "max-w-2xl")}>
        <h2 className="font-heading text-4xl font-extrabold tracking-[-0.04em] text-on-background sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        <div className={cn("intelligence-beam", align === "center" ? "mx-auto w-32" : "w-28")} />
        {description ? (
          <p className="text-base leading-8 text-on-surface-variant sm:text-lg">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
