import Link from "next/link";
import { navigation, siteConfig } from "@/content/site";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="bg-surface-container-lowest pb-8 pt-16 sm:pb-10 sm:pt-20">
      <Container className="space-y-10 sm:space-y-14">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="space-y-6 md:col-span-2 lg:col-span-1">
            <Link
              href="/#top"
              className="inline-block font-heading text-2xl font-bold uppercase tracking-[0.2em] text-on-background transition-colors hover:text-primary sm:text-3xl sm:tracking-[0.22em]"
            >
              {siteConfig.shortName}
            </Link>
            <p className="max-w-sm md:max-w-none lg:max-w-sm text-sm leading-7 text-on-surface-variant">
              Engineered for authority. Auto Mark AI creates operational intelligence systems that feel calm,
              premium, and production-ready from day one.
            </p>
          </div>

          <div className="space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.26em] text-white">Company</h3>
            <div className="flex flex-col gap-3">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-on-surface-variant hover:text-on-background"
                >
                  {item.label.replace("/#", "")}
                </Link>
              ))}
              <Link href="/#faq" className="text-sm text-on-surface-variant hover:text-on-background">
                FAQ
              </Link>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.26em] text-white">Legal</h3>
            <div className="flex flex-col gap-3">
              <Link href="/privacy" className="text-sm text-on-surface-variant hover:text-on-background">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-on-surface-variant hover:text-on-background">
                Terms of Service
              </Link>
              <Link
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-sm text-on-surface-variant hover:text-on-background"
              >
                {siteConfig.contactEmail}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant/10 pt-8 text-sm text-on-surface-variant">
          <p>&copy; 2026 Auto Mark AI. Engineered for authority.</p>
        </div>
      </Container>
    </footer>
  );
}
