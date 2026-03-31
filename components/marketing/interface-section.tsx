import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LayersIcon, NetworkIcon, ShieldIcon } from "@/components/ui/icons";
import { interfaceCapabilities } from "@/content/site";

const capabilityIcons = [LayersIcon, ShieldIcon, NetworkIcon];

export function InterfaceSection() {
  return (
    <section className="bg-surface-container-low py-24 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-high">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2twFXhwd_i-WEuqCdXxsnTiMCSMYj2QXVir0POwzmA71gY7BbCT9oZZTJ2nqPDWehNOl5zwdfG5ISrZs8tlErACxa3CnSnwmsELPoiHqmDkzD7G2EI-6xg1Ev2FuzNrjYAS906FKigggQpaIBCskA22NLmc7KxUX36_CMigxa_hHqpl1lw83iAanISO6cfIQ0bkydh3lxYOvzWUvcICoWgDMpTvRdL7VOgGrfm_MOZxW6--0vHxlWYXvEd_v9cIeYkO4gTI4XTyI"
              alt="Hands typing on a keyboard in a dark cinematic studio."
              width={1200}
              height={1200}
              className="aspect-square w-full object-cover grayscale"
            />

            <div className="absolute bottom-5 left-5 rounded-[1.6rem] bg-primary-container px-6 py-5 text-on-primary shadow-[0_20px_60px_rgba(20,184,166,0.2)]">
              <p className="font-heading text-4xl font-black tracking-[-0.06em]">99.8%</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em]">Signal integrity target</p>
            </div>
          </div>
        </div>

        <div className="order-1 space-y-8 lg:order-2">
          <SectionHeading
            eyebrow="Interface"
            title="The production-ready interface."
            description="Enterprise AI needs more than a prompt box. It needs orchestration, visibility, and control that sits comfortably inside the way real operators work."
          />

          <div className="space-y-5">
            {interfaceCapabilities.map((capability, index) => {
              const Icon = capabilityIcons[index];

              return (
                <article
                  key={capability.title}
                  className="rounded-[2rem] bg-surface-container px-6 py-6 sm:px-7 sm:py-7"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
                        {capability.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-on-surface-variant">{capability.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
