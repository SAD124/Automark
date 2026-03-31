import { AboutSection } from "@/components/marketing/about-section";
import { BookCallSection } from "@/components/marketing/book-call-section";
import { EvolutionSection } from "@/components/marketing/evolution-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { Hero } from "@/components/marketing/hero";
import { InterfaceSection } from "@/components/marketing/interface-section";
import { MethodologySection } from "@/components/marketing/methodology-section";
import { ProofSection } from "@/components/marketing/proof-section";
import { ServicesSection } from "@/components/marketing/services-section";
import { TrustStrip } from "@/components/marketing/trust-strip";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ServicesSection />
      <InterfaceSection />
      <MethodologySection />
      <EvolutionSection />
      <AboutSection />
      <ProofSection />
      <FAQSection />
      <BookCallSection />
    </>
  );
}
