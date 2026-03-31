import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { evolutionTimeline } from "@/content/site";

export function EvolutionSection() {
  return (
    <section id="evolution" className="bg-surface-container-low py-24 sm:py-32">
      <Container className="space-y-16">
        <SectionHeading
          eyebrow="Perspective"
          title="The AI evolution."
          description="The market is moving from isolated assistants to coordinated operating systems. Auto Mark AI is positioned in the layer that comes after experimentation."
          align="center"
        />

        <div className="relative grid gap-6 lg:grid-cols-3">
          <div className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-linear-to-r from-transparent via-primary/30 to-transparent lg:block" />
          {evolutionTimeline.map((item, index) => (
            <article
              key={item.year}
              className={`relative rounded-[2rem] p-8 text-center ${
                index === evolutionTimeline.length - 1
                  ? "bg-surface-container-highest ring-1 ring-primary/25"
                  : "bg-surface-container-high"
              }`}
            >
              <div
                className={`mx-auto mb-6 h-4 w-4 rounded-full ${
                  index === evolutionTimeline.length - 1 ? "bg-primary shadow-[0_0_16px_rgba(79,219,200,0.45)]" : "bg-primary-fixed-dim/85"
                }`}
              />
              <p className="font-heading text-3xl font-black tracking-[-0.05em] text-primary">{item.year}</p>
              <h3 className="mt-3 text-lg font-semibold uppercase tracking-[0.12em] text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-on-surface-variant">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
