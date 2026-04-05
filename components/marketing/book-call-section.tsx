import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

function buildCalendlyEmbedUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}hide_event_type_details=1&hide_gdpr_banner=1&background_color=131315&text_color=e5e1e4&primary_color=14b8a6`;
}

export function BookCallSection() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();
  const isCalendlyConfigured = Boolean(calendlyUrl);

  return (
    <section
      id="book-call"
      className="relative overflow-hidden bg-surface-container-lowest py-24 sm:py-28 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(79,219,200,0.16),transparent_72%)]" />
      <Container className="grid gap-8 sm:gap-10 xl:grid-cols-[0.76fr_1.24fr] xl:items-start">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Book a call"
            title="Ready to turn the concept into a live authority site?"
            description="Book a strategy call to review the offer, refine the build direction, and align the next execution step."
          />
          <div className="rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(14,14,16,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
            <div className="flex flex-wrap gap-3">
              {[
                "30 minute founder strategy session",
                "Offer and funnel review",
                "Execution-path recommendation",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/90"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm leading-7 text-on-surface-variant">
                The call is designed to move from vague interest into a clear execution decision. We use the session
                to pressure-test the opportunity, identify what should ship first, and align the next commercial move.
              </p>
              <div className="grid gap-4 border-t border-white/6 pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                    What gets covered
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Positioning, offer clarity, market viability, and the fastest route to a credible first release.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                    Best for
                  </p>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    Founders who want a sharper build direction before committing more time, money, or team attention.
                  </p>
                </div>
              </div>
            </div>

            {isCalendlyConfigured ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/6 pt-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                    Calendly embed active
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Visitors can schedule directly here or open the booking page in a separate tab.
                  </p>
                </div>
                <ButtonLink href={calendlyUrl!} target="_blank" rel="noreferrer" variant="secondary">
                  Open booking page
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/6 pt-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary/80">
                    Waiting for booking URL
                  </p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Add the public Calendly event link and this becomes a live scheduling surface automatically.
                  </p>
                </div>
                <ButtonLink href="mailto:hello@automarkai.com" variant="secondary">
                  Request booking link
                </ButtonLink>
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(25,25,27,0.95),rgba(15,15,17,1))] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="pointer-events-none absolute inset-x-[12%] top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(79,219,200,0.22),transparent_72%)]" />
          <div className="relative flex items-center justify-between rounded-[1.4rem] border border-white/6 bg-white/[0.02] px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-primary/80">
                Live scheduling surface
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Embedded booking flow for founder strategy calls
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(79,219,200,0.65)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                {isCalendlyConfigured ? "Ready" : "Standby"}
              </span>
            </div>
          </div>

          {isCalendlyConfigured ? (
            <iframe
              title="Book a call with Auto Mark AI"
              src={buildCalendlyEmbedUrl(calendlyUrl!)}
              loading="lazy"
              className="relative mt-2 min-h-[540px] w-full rounded-[1.5rem] border border-white/6 bg-background sm:min-h-[640px] xl:min-h-[760px]"
            />
          ) : (
            <div className="relative mt-2 flex min-h-[540px] flex-col items-center justify-center rounded-[1.5rem] border border-white/6 bg-background px-6 text-center sm:min-h-[640px] sm:px-8 xl:min-h-[760px]">
              <div className="mb-8 flex items-center gap-3 rounded-full border border-primary/18 bg-primary/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(79,219,200,0.65)]" />
                Scheduling placeholder
              </div>
              <h3 className="mt-5 max-w-xl font-heading text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
                Add your Calendly link and this becomes a live in-page booking calendar.
              </h3>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-on-surface-variant sm:text-base sm:leading-8">
                Paste a public Calendly event URL into `NEXT_PUBLIC_CALENDLY_URL` and the embed will activate
                automatically on the marketing page.
              </p>
              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {["Inline booking", "No page exit", "Vercel-ready config"].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
