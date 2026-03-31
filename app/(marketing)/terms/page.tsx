import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing the use of the Auto Mark AI website.",
};

export default function TermsPage() {
  return (
    <section className="bg-background py-20 sm:py-24">
      <Container className="max-w-4xl">
        <div className="rounded-[2rem] bg-surface-container px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Legal</p>
          <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-5xl">
            Terms of Service
          </h1>
          <div className="legal-copy mt-8 space-y-6">
            <p>
              These terms govern access to and use of the Auto Mark AI website. By using this site, you agree to
              use it lawfully and in a way that does not interfere with its operation or the experience of other
              visitors.
            </p>
            <h2>Informational use</h2>
            <p>
              The website content is provided for general informational and marketing purposes. It does not create
              a client relationship by itself and may evolve as the business offering is refined.
            </p>
            <h2>Intellectual property</h2>
            <p>
              Unless otherwise noted, the site design, copy, branding, and presentation are the property of Auto
              Mark AI and may not be reproduced without permission.
            </p>
            <h2>Third-party links</h2>
            <p>
              The site may link to external services, including scheduling or infrastructure providers. Auto Mark
              AI is not responsible for the content or practices of third-party platforms.
            </p>
            <h2>Availability</h2>
            <p>
              We aim to keep the site accessible and accurate, but we do not guarantee uninterrupted access or
              that all content is free from errors at all times.
            </p>
            <h2>Contact</h2>
            <p>
              Questions about these terms can be directed to{" "}
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
