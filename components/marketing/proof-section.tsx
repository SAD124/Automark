import { Container } from "@/components/ui/container";
import { proofHighlights } from "@/content/site";

export function ProofSection() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <Container>
        <div className="grid auto-rows-[260px] gap-5 md:grid-cols-3">
          <article className="relative overflow-hidden rounded-[2rem] bg-surface-container p-8 md:col-span-2 md:row-span-2 sm:p-12">
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-[55%] bg-[radial-gradient(circle_at_right,rgba(79,219,200,0.22),transparent_56%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(79,219,200,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(79,219,200,0.08)_1px,transparent_1px)] [background-size:42px_42px]"
            />

            <div className="relative z-10 flex h-full max-w-md flex-col justify-end">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Global scale</p>
              <h3 className="mt-4 font-heading text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">
                Redefining the global network.
              </h3>
              <p className="mt-5 text-base leading-8 text-on-surface-variant">
                The site is designed to imply cross-market capability, premium positioning, and a system-level
                approach to intelligence deployment.
              </p>
            </div>
          </article>

          <article className="rounded-[2rem] bg-surface-container-high p-8">
            <p className="font-heading text-4xl font-black tracking-[-0.06em] text-primary">Compliance</p>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              Cross-border governance thinking for teams operating across multiple regions and communication contexts.
            </p>
          </article>

          <article className="rounded-[2rem] bg-primary-container p-8 text-on-primary">
            <p className="font-heading text-4xl font-black tracking-[-0.06em]">Velocity</p>
            <p className="mt-4 text-sm leading-7 text-on-primary/80">
              A premium launch path on Vercel, with structure in place for future iteration and deeper product work.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {proofHighlights.map((highlight) => (
            <article key={highlight.value} className="rounded-[2rem] bg-surface-container-high px-7 py-8">
              <p className="font-heading text-4xl font-black tracking-[-0.06em] text-white">{highlight.value}</p>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-on-surface-variant">{highlight.label}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
