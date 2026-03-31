import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy information for visitors and prospective clients of Auto Mark AI.",
};

export default function PrivacyPage() {
  return (
    <section className="bg-background py-20 sm:py-24">
      <Container className="max-w-4xl">
        <div className="rounded-[2rem] bg-surface-container px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Legal</p>
          <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <div className="legal-copy mt-8 space-y-6">
            <p>
              Auto Mark AI respects the privacy of visitors, clients, and prospective partners. This website is
              designed as a marketing presence and may collect limited information through analytics tools,
              contact actions, or booking integrations once configured for production.
            </p>
            <h2>Information we may collect</h2>
            <p>
              Depending on the tools enabled at launch, we may collect basic usage data, browser details, referral
              sources, and information that you voluntarily provide through email or scheduling forms.
            </p>
            <h2>How information is used</h2>
            <ul>
              <li>To respond to inquiries and schedule discovery calls.</li>
              <li>To improve site performance, clarity, and conversion flow.</li>
              <li>To maintain security and prevent misuse of the website.</li>
            </ul>
            <h2>Third-party services</h2>
            <p>
              Production deployment may include Vercel-hosted infrastructure and a Calendly scheduling embed. Each
              third-party provider may process data according to its own privacy policies.
            </p>
            <h2>Contact</h2>
            <p>
              For privacy-related questions, contact Auto Mark AI at{" "}
              <a className="text-primary" href="mailto:hello@automarkai.com">
                hello@automarkai.com
              </a>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
