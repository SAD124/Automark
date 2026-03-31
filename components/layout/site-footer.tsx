import Link from "next/link";
import { navigation, siteConfig } from "@/content/site";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="bg-surface-container-lowest pb-10 pt-20">
      <Container className="space-y-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="space-y-6">
            <p className="font-heading text-3xl font-black uppercase tracking-[-0.05em] text-white/18">
              {siteConfig.shortName}
            </p>
            <p className="max-w-sm text-sm leading-7 text-on-surface-variant">
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
              <Link href={`mailto:${siteConfig.contactEmail}`} className="text-sm text-on-surface-variant hover:text-on-background">
                {siteConfig.contactEmail}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-outline-variant/10 pt-8 text-sm text-on-surface-variant md:flex-row md:items-center md:justify-between">
          <p>© 2026 Auto Mark AI. Engineered for authority.</p>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
