"use client";

import { useState } from "react";
import Link from "next/link";
import { navigation, siteConfig } from "@/content/site";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 pt-4">
      <Container>
        <div className="glass-panel flex items-center justify-between rounded-full border border-outline-variant/15 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-on-background"
          >
            {siteConfig.shortName}
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-background"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ButtonLink
              href="/business-validator"
              variant="secondary"
              className="min-h-10 px-5 py-2 text-sm"
            >
              Business Validator
            </ButtonLink>
            <ButtonLink
              href="/#book-call"
              className="min-h-10 px-5 py-2 text-sm"
            >
              Book a Call
            </ButtonLink>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 text-on-background md:hidden"
            onClick={() => setIsOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1.5">
              <span className="block h-px w-4 bg-current" />
              <span
                className={cn(
                  "block h-px w-4 bg-current",
                  isOpen && "translate-x-1",
                )}
              />
              <span className="block h-px w-4 bg-current" />
            </div>
          </button>
        </div>

        {isOpen ? (
          <div className="glass-panel mt-3 rounded-4xl border border-outline-variant/15 p-6 md:hidden">
            <div className="flex flex-col gap-5">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-background"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <ButtonLink href="/business-validator" className="mt-2 w-full">
                Business Validator
              </ButtonLink>
              <ButtonLink href="/#book-call" className="mt-2 w-full">
                Book a Call
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </Container>
    </header>
  );
}
