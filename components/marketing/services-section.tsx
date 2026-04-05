import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { servicePillars } from "@/content/site";

export function ServicesSection() {
  return (
    <section id="services" className="bg-background py-24 sm:py-28 lg:py-32">
      <Container className="space-y-10 sm:space-y-12 lg:space-y-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-end xl:grid-cols-[1.08fr_0.92fr]">
          <SectionHeading
            eyebrow="Services"
            title="The authority stack for teams who need more than prompts."
            description="The goal is not to add another AI widget to your workflow. The goal is to build an intelligence operating layer that your team can actually trust, use, and scale."
            className="max-w-3xl"
          />

          <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-low/70 p-5 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-fixed-dim">
              Delivery lens
            </p>
            <p className="mt-4 font-heading text-xl font-bold tracking-[-0.05em] text-white sm:text-2xl">
              Research, execution, and governance designed as one composed operating layer.
            </p>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              Every engagement is shaped to feel precise on the front end and disciplined underneath, so teams
              get strategic clarity without inheriting operational chaos.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1.08fr_0.92fr]">
          <article className="relative overflow-hidden rounded-[2.25rem] bg-surface-container p-6 sm:p-8 md:p-10 xl:min-h-[32rem] xl:p-12">
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-[52%] bg-[radial-gradient(circle_at_right,rgba(79,219,200,0.16),transparent_62%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(79,219,200,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(79,219,200,0.08)_1px,transparent_1px)] [background-size:38px_38px]"
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">What we deliver</p>
                <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.06em] text-white sm:text-3xl xl:text-4xl">
                  Bespoke systems for research, go-to-market execution, and internal intelligence.
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-on-surface-variant sm:mt-5 sm:text-base sm:leading-8">
                  We combine editorial restraint with systems thinking. That means less clutter, more clarity,
                  and interfaces that make advanced automation feel composed rather than chaotic.
                </p>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {servicePillars.map((pillar) => (
                  <div
                    key={pillar.eyebrow}
                    className="min-w-0 rounded-[1.4rem] border border-white/8 bg-background/55 px-4 py-4 backdrop-blur"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-primary-fixed-dim">
                      {pillar.eyebrow}
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
                      {pillar.title.split(".")[0]}.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <div className="grid gap-5">
            {servicePillars.map((pillar) => (
              <article
                key={pillar.title}
                className="flex h-full flex-col rounded-[2rem] bg-surface-container-high p-6 sm:p-8"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-fixed-dim">
                  {pillar.eyebrow}
                </p>
                <h3 className="mt-4 font-heading text-xl font-bold tracking-[-0.05em] text-white sm:text-[1.75rem]">
                  {pillar.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
