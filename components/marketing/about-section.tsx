import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const focusAreas = [
  "Strategy and deployment architecture",
  "Premium marketing systems and brand framing",
  "High-signal handoff documentation for internal teams",
];

export function AboutSection() {
  return (
    <section id="about" className="bg-surface-container-lowest py-24 sm:py-28 lg:py-32">
      <Container className="grid gap-10 sm:gap-12 md:grid-cols-2 md:items-start xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 self-start sm:space-y-8">
          <SectionHeading
            eyebrow="About"
            title="The elite consultancy model."
            description="This is intentionally positioned like a high-end strategic partner. The visual language says premium authority; the delivery model backs it up."
          />

          <div className="overflow-hidden rounded-[2rem] bg-surface-container">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaAA90enZuRNY5ZPYx7De9ZUMErWyCba6r6mMM7GCu2VOatfzmTfn_s3kg4KLOHsI_qqnM5rFpDu7t5rwRKpuzJsaLx9DcpPMUUry7a4esleYymGvDXZD7iKG9NnKeWsHl__wJ7U7Fje09_cWQuVvNN4QRGoQ-blybimZvyvDSgDj7sYGIu-mfW3F7iLMRahsj0WwYY_mvZUnD7iu_07Od_LCOi1QQfO4iipm2hojKU-tYbKB4esap0-_vIXljcOib2kg9IxkLvis"
              alt="Consultants in a modern glass office."
              width={1400}
              height={900}
              className="aspect-video w-full object-cover grayscale"
            />
          </div>
        </div>

        <div className="space-y-6 self-start sm:space-y-8">
          <blockquote className="text-xl font-light italic leading-relaxed tracking-[-0.03em] text-on-surface-variant sm:text-2xl">
            &ldquo;We do not just sell software. We design operating leverage. The output should feel structurally
            transformative, not cosmetically innovative.&rdquo;
          </blockquote>

          <div className="space-y-4">
            {focusAreas.map((area) => (
              <div
                key={area}
                className="rounded-[1.35rem] bg-surface-container-high px-5 py-4 text-sm text-on-surface-variant sm:rounded-full"
              >
                {area}
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] bg-surface-container p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">Director of intelligence</p>
            <p className="mt-3 font-heading text-2xl font-bold tracking-[-0.05em] text-white">
              Strategy-led deployment, with a product-grade eye for detail.
            </p>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              The brand position is premium by design. The site needs to communicate that the team understands
              both technology and presentation at a high level.
            </p>
            <ButtonLink href="/#book-call" className="mt-6 w-full sm:w-auto">
              Book strategic consultation
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
