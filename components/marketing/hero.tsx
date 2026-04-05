import { HeroContent } from "@/components/marketing/hero-content";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-mesh" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,219,200,0.06),transparent_48%)]"
      />

      <HeroContent />
    </section>
  );
}
