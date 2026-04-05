import { Container } from "@/components/ui/container";

const trustItems = [
  "Multi-agent system design",
  "Sales and research automation",
  "Governance-first deployment logic",
  "Vercel-ready marketing presence",
];

export function TrustStrip() {
  return (
    <section className="bg-surface-container-low py-5 sm:py-6">
      <Container className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] xl:items-center">
        <p className="font-heading text-base font-bold uppercase tracking-[-0.04em] text-on-background sm:text-lg md:col-span-2 xl:col-span-1">
          Built to feel like a consultancy, not a generic SaaS template.
        </p>
        {trustItems.map((item) => (
          <div
            key={item}
            className="rounded-[1.4rem] bg-surface-container px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant sm:rounded-full sm:text-xs sm:tracking-[0.2em]"
          >
            {item}
          </div>
        ))}
      </Container>
    </section>
  );
}
