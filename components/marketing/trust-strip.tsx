import { Container } from "@/components/ui/container";

const trustItems = [
  "Multi-agent system design",
  "Sales and research automation",
  "Governance-first deployment logic",
  "Vercel-ready marketing presence",
];

export function TrustStrip() {
  return (
    <section className="bg-surface-container-low py-6">
      <Container className="grid gap-4 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] lg:items-center">
        <p className="font-heading text-lg font-bold uppercase tracking-[-0.04em] text-on-background">
          Built to feel like a consultancy, not a generic SaaS template.
        </p>
        {trustItems.map((item) => (
          <div
            key={item}
            className="rounded-full bg-surface-container px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant"
          >
            {item}
          </div>
        ))}
      </Container>
    </section>
  );
}
