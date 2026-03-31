import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqItems } from "@/content/site";

export function FAQSection() {
  return (
    <section id="faq" className="bg-surface-container-low py-24 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions we should answer before launch."
          description="Because the business inputs are still light, the FAQ is designed to reduce uncertainty while keeping the tone premium and assured."
        />

        <div className="space-y-4">
          {faqItems.map((item) => (
            <details key={item.question} className="group rounded-[2rem] bg-surface-container px-6 py-5">
              <summary className="cursor-pointer list-none font-heading text-xl font-semibold tracking-[-0.04em] text-white">
                {item.question}
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
