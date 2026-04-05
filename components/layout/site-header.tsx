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
    <header className="sticky top-0 z-50 pt-3 sm:pt-4">
      <Container>
        <div className="glass-panel flex items-center justify-between rounded-[1.75rem] border border-outline-variant/15 px-4 py-3 sm:rounded-full sm:px-6">
          <Link
            href="/"
            className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-on-background sm:text-sm sm:tracking-[0.22em]"
          >
            {siteConfig.shortName}
          </Link>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
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

          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            <ButtonLink
              href="/business-validator"
              variant="secondary"
              className="min-h-10 px-4 py-2 text-sm xl:px-5"
            >
              Business Validator
            </ButtonLink>
            <ButtonLink
              href="/#book-call"
              className="min-h-10 px-4 py-2 text-sm xl:px-5"
            >
              Book a Call
            </ButtonLink>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/20 text-on-background lg:hidden"
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
          <div className="glass-panel mt-3 rounded-[2rem] border border-outline-variant/15 p-5 lg:hidden">
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
