import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { servicePillars } from "@/content/site";

export function ServicesSection() {
  return (
    <section id="services" className="bg-background py-24 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionHeading
          eyebrow="Services"
          title="The authority stack for teams who need more than prompts."
          description="The goal is not to add another AI widget to your workflow. The goal is to build an intelligence operating layer that your team can actually trust, use, and scale."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <article className="rounded-[2rem] bg-surface-container p-8 sm:row-span-2 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">What we deliver</p>
            <h3 className="mt-5 font-heading text-3xl font-bold tracking-[-0.05em] text-white">
              Bespoke systems for research, go-to-market execution, and internal intelligence.
            </h3>
            <p className="mt-5 max-w-md text-sm leading-7 text-on-surface-variant sm:text-base">
              We combine editorial restraint with systems thinking. That means less clutter, more clarity, and
              interfaces that make advanced automation feel composed rather than chaotic.
            </p>
          </article>

          {servicePillars.map((pillar) => (
            <article key={pillar.title} className="rounded-[2rem] bg-surface-container-high p-7 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-fixed-dim">
                {pillar.eyebrow}
              </p>
              <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.05em] text-white">
                {pillar.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-on-surface-variant">{pillar.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
