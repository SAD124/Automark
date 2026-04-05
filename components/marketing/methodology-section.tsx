import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { methodologySteps } from "@/content/site";

export function MethodologySection() {
  return (
    <section id="methodology" className="bg-background py-24 sm:py-28 lg:py-32">
      <Container className="space-y-10 sm:space-y-14">
        <SectionHeading
          eyebrow="Methodology"
          title="A composed delivery process for complex systems."
          description="The experience should feel premium, but the execution still needs rigor. We use a disciplined process that keeps the project strategic, concrete, and shippable."
          align="center"
        />

        <div className="grid gap-5 md:grid-cols-2 md:items-start xl:grid-cols-[1.1fr_0.9fr]">
          <article className="self-start rounded-[2rem] bg-surface-container p-6 sm:p-10 xl:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">The operating principle</p>
            <h3 className="mt-5 max-w-2xl font-heading text-2xl font-bold tracking-[-0.05em] text-white sm:text-3xl xl:text-4xl">
              We reduce noise, define agency boundaries, then build the system around measurable decision flow.
            </h3>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-on-surface-variant sm:mt-6 sm:text-base sm:leading-8">
              That means every implementation starts with the same question: what should the system decide,
              what should it execute, and where should a human remain in control? The answer shapes everything
              from interface hierarchy to rollout scope.
            </p>
          </article>

          <div className="grid gap-5">
            {methodologySteps.map((step, index) => (
              <article
                key={step.index}
                className={`rounded-[2rem] p-6 sm:p-8 ${
                  index === 1 ? "bg-surface-container-highest" : "bg-surface-container-high"
                }`}
              >
                <p className="font-heading text-3xl font-black tracking-[-0.07em] text-primary sm:text-4xl">{step.index}</p>
                <h3 className="mt-4 font-heading text-xl font-bold tracking-[-0.05em] text-white sm:mt-5 sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
