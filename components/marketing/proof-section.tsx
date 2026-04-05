import { Container } from "@/components/ui/container";
import { proofHighlights } from "@/content/site";

export function ProofSection() {
  return (
    <section className="bg-background py-24 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-5 md:grid-cols-2 xl:auto-rows-[260px] xl:grid-cols-3">
          <article className="relative overflow-hidden rounded-[2rem] bg-surface-container p-6 sm:p-8 md:col-span-2 xl:col-span-2 xl:row-span-2 xl:p-12">
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-[55%] bg-[radial-gradient(circle_at_right,rgba(79,219,200,0.22),transparent_56%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(79,219,200,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(79,219,200,0.08)_1px,transparent_1px)] [background-size:42px_42px]"
            />

            <div className="relative z-10 flex h-full max-w-lg flex-col justify-between">
              <div className="max-w-[14rem] rounded-[1.35rem] border border-white/8 bg-background/45 px-4 py-4 backdrop-blur sm:rounded-[1.5rem] sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary-fixed-dim">
                  System reach
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Cross-market deployment thinking for ambitious operators.
                </p>
              </div>

              <div className="pt-8 sm:pt-10">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Global scale</p>
                <h3 className="mt-4 font-heading text-3xl font-bold tracking-[-0.06em] text-white sm:text-4xl xl:text-5xl">
                  Redefining the global network.
                </h3>
                <p className="mt-5 text-base leading-8 text-on-surface-variant">
                  The site is designed to imply cross-market capability, premium positioning, and a system-level
                  approach to intelligence deployment.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] bg-surface-container-high p-6 sm:p-8">
            <p className="font-heading text-3xl font-black tracking-[-0.06em] text-primary sm:text-4xl">Compliance</p>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              Cross-border governance thinking for teams operating across multiple regions and communication contexts.
            </p>
          </article>

          <article className="rounded-[2rem] bg-primary-container p-6 text-on-primary sm:p-8">
            <p className="font-heading text-3xl font-black tracking-[-0.06em] sm:text-4xl">Velocity</p>
            <p className="mt-4 text-sm font-semibold leading-7 text-on-primary/90">
              A premium launch path on Vercel, with structure in place for future iteration and deeper product work.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {proofHighlights.map((highlight) => (
            <article key={highlight.value} className="rounded-[2rem] bg-surface-container-high px-6 py-7 sm:px-7 sm:py-8">
              <p className="font-heading text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">{highlight.value}</p>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-on-surface-variant">{highlight.label}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
