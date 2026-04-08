import type { Metadata } from "next";
import { AIReadinessScoreTool } from "@/components/marketing/ai-readiness-score-tool";
import { Container } from "@/components/ui/container";

const bookingHref =
  process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() || "/#book-call";

const bookingExternal = bookingHref.startsWith("http");

export const metadata: Metadata = {
  title: "AI Readiness Score",
  description:
    "Answer a short quiz to score how ready your business is for AI and get focused next-step recommendations.",
  alternates: {
    canonical: "/ai-readiness-score",
  },
};

export default function AIReadinessScorePage() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-18 lg:py-22">
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-65" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(79,219,200,0.16),transparent_72%)]" />

      <Container className="relative">
        <div className="mx-auto max-w-4xl space-y-7 sm:space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary/85">
              Free Tool
            </p>
            <h1 className="font-heading text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.06em] text-white sm:text-[3.6rem]">
              AI Readiness Score
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
              8 questions. A 0-100 score. Clear next steps.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {["2 min quiz", "4 category breakdown", "3 AI tool suggestions"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant"
                >
                  {item}
                </span>
              ),
            )}
          </div>

          <AIReadinessScoreTool
            bookingHref={bookingHref}
            bookingExternal={bookingExternal}
          />
        </div>
      </Container>
    </section>
  );
}
