import { Container } from "@/components/ui/container";
import { EvolutionPerspectivePanel } from "@/components/marketing/evolution-perspective-panel";
import { EvolutionTimeline } from "@/components/marketing/evolution-timeline";
import { SectionHeading } from "@/components/ui/section-heading";

export function EvolutionSection() {
  return (
    <section
      id="evolution"
      className="bg-surface-container-low py-24 sm:py-28 lg:py-32"
    >
      <Container className="space-y-10 sm:space-y-16">
        <SectionHeading
          eyebrow="Perspective"
          title="The market is leaving prompt theater behind."
          description="AI value is shifting from isolated assistants to governed systems that can research, decide, and execute with measurable reliability. Auto Mark AI is built for that transition."
          align="center"
        />

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
          <EvolutionPerspectivePanel />
          <EvolutionTimeline />
        </div>
      </Container>
    </section>
  );
}
