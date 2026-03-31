import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

function buildCalendlyEmbedUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}hide_event_type_details=1&hide_gdpr_banner=1&background_color=131315&text_color=e5e1e4&primary_color=14b8a6`;
}

export function BookCallSection() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <section id="book-call" className="bg-surface-container-lowest py-24 sm:py-32">
      <Container className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Book a call"
            title="Ready to turn the concept into a live authority site?"
            description="The site is now structured for a Vercel deployment. Add a real Calendly URL and this section becomes a fully embedded booking flow."
          />
          <div className="rounded-[2rem] bg-surface-container p-8">
            <p className="text-sm leading-7 text-on-surface-variant">
              Current setup note: because no live scheduling link was provided, this area gracefully falls back to
              a styled CTA until `NEXT_PUBLIC_CALENDLY_URL` is configured.
            </p>
            {calendlyUrl ? (
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                Calendly embed active
              </p>
            ) : (
              <ButtonLink href="mailto:hello@automarkai.com" className="mt-6">
                Request booking link
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-surface-container p-2">
          {calendlyUrl ? (
            <iframe
              title="Book a call with Auto Mark AI"
              src={buildCalendlyEmbedUrl(calendlyUrl)}
              className="min-h-[760px] w-full rounded-[1.5rem] bg-background"
            />
          ) : (
            <div className="flex min-h-[760px] flex-col items-center justify-center rounded-[1.5rem] bg-background px-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Scheduling placeholder</p>
              <h3 className="mt-5 max-w-xl font-heading text-4xl font-bold tracking-[-0.05em] text-white">
                Drop in the Calendly URL and this panel becomes your live booking experience.
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-8 text-on-surface-variant">
                Use an environment variable named `NEXT_PUBLIC_CALENDLY_URL` in Vercel project settings to turn
                the placeholder into a production embed without editing the layout.
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
