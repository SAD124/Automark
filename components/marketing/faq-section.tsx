"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqItems } from "@/content/site";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-surface-container-low py-24 sm:py-28 lg:py-32">
      <Container className="grid gap-10 sm:gap-12 md:grid-cols-2 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions we should answer before launch."
          description="Because the business inputs are still light, the FAQ is designed to reduce uncertainty while keeping the tone premium and assured."
        />

        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;

            return (
              <article
                key={item.question}
                className={`rounded-[2rem] border px-5 py-4 transition-all duration-300 sm:px-6 sm:py-5 ${
                  isOpen
                    ? "border-primary/25 bg-surface-container-high shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
                    : "border-transparent bg-surface-container"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex((current) => (current === index ? null : index))}
                  className="flex w-full items-center justify-between gap-4 sm:gap-6 text-left"
                >
                  <span className="font-heading text-lg font-semibold tracking-[-0.04em] text-white sm:text-xl">
                    {item.question}
                  </span>
                  <span
                    aria-hidden
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/8 bg-background/30 text-base text-primary transition-transform duration-300 sm:h-10 sm:w-10 sm:text-lg ${
                      isOpen ? "rotate-45" : "rotate-0"
                    }`}
                  >
                    +
                  </span>
                </button>

                <div
                  id={panelId}
                  className={`grid overflow-hidden transition-all duration-300 ease-out ${
                    isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0">
                    <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
