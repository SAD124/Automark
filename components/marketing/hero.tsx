import { ArrowRightIcon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { heroStats } from "@/content/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-mesh" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,219,200,0.06),transparent_48%)]"
      />

      <Container className="relative pb-24 pt-20 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-high/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-primary-fixed-dim ring-1 ring-white/6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-65" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            Editorial intelligence for modern operators
          </div>

          <div className="mt-8 space-y-8">
            <h1 className="headline-gradient font-heading text-6xl font-extrabold uppercase leading-[0.84] tracking-[-0.08em] sm:text-7xl lg:text-[8rem]">
              Authority
              <br />
              Through
              <br />
              Intelligence
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-8 text-on-surface-variant sm:text-xl">
              We engineer autonomous multi-agent systems, intelligence operations, and execution layers that
              move ambitious companies beyond chatbots and into governed, production-ready AI infrastructure.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="/#book-call" className="min-w-52">
              Book a Strategy Call
            </ButtonLink>
            <ButtonLink href="/#methodology" variant="secondary" className="min-w-52">
              View methodology
            </ButtonLink>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Designed for teams that need calm, high-signal systems.</span>
            <ArrowRightIcon className="h-4 w-4 text-primary" />
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[2rem] bg-surface-container/80 px-6 py-6 text-left ring-1 ring-white/5 backdrop-blur"
              >
                <p className="font-heading text-3xl font-black tracking-[-0.05em] text-white">{stat.value}</p>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
