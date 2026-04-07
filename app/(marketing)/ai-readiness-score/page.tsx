import type { Metadata } from "next";
import { AIReadinessScoreTool } from "@/components/marketing/ai-readiness-score-tool";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const bookingHref =
  process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() || "/#book-call";

const bookingExternal = bookingHref.startsWith("http");

export const metadata: Metadata = {
  title: "AI Readiness Score",
  description:
    "Take the Auto Mark AI assessment to score how ready your business is for AI adoption and get practical recommendations.",
  alternates: {
    canonical: "/ai-readiness-score",
  },
};

export default function AIReadinessScorePage() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(79,219,200,0.18),transparent_72%)]" />

      <Container className="relative space-y-12 sm:space-y-14">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <SectionHeading
            eyebrow="Free tool"
            title="Score how ready your business is to adopt AI."
            description="Answer a short set of questions about your current systems, team, data, and budget intent. The assessment returns an overall score, category breakdown, and the most practical next moves."
          />

          <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,26,0.96),rgba(12,12,14,1))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
              What you get
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  title: "Overall score",
                  description:
                    "A quick 0-100 benchmark for how prepared the business is to launch a useful AI pilot.",
                },
                {
                  title: "Category breakdown",
                  description:
                    "Four scored areas that show whether systems, people, data, or strategy is slowing momentum.",
                },
                {
                  title: "Actionable output",
                  description:
                    "Personalized recommendations plus suggested AI tool directions for the first implementation step.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.45rem] border border-white/7 bg-white/[0.03] px-5 py-5"
                >
                  <p className="font-heading text-2xl font-bold tracking-[-0.04em] text-white">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AIReadinessScoreTool
          bookingHref={bookingHref}
          bookingExternal={bookingExternal}
        />
      </Container>
    </section>
  );
}
