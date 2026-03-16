"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { WaitlistModal } from "@/components/waitlist-modal"
import { useTranslation } from "@/lib/i18n/context"

export function Footer() {
  const { t } = useTranslation()
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  return (
    <>
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <a href="/" className="flex items-center gap-3 mb-4" onClick={(e) => handleNavClick(e, "/")}>
                <Image
                  src="/images/nairi-logo-header.jpg"
                  alt="Nairi Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="text-xl font-semibold gradient-text">Nairi</span>
              </a>
              <p className="text-sm text-muted-foreground mb-4">
                {t.footer.description}
              </p>
              <button
                onClick={() => setWaitlistOpen(true)}
                className="text-sm text-[#e879f9] hover:text-[#22d3ee] transition-colors"
              >
                {t.footer.joinWaitlist}
              </button>
            </div>

            <div>
              <h4 className="font-medium mb-4">{t.footer.productSection}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => handleNavClick(e, "#how-it-works")}
                    className="hover:text-foreground transition-colors"
                  >
                    {t.footer.links.howItWorks}
                  </a>
                </li>
                <li>
                  <a
                    href="#capabilities"
                    onClick={(e) => handleNavClick(e, "#capabilities")}
                    className="hover:text-foreground transition-colors"
                  >
                    {t.footer.links.capabilities}
                  </a>
                </li>
                <li>
                  <a
                    href="#marketplace"
                    onClick={(e) => handleNavClick(e, "#marketplace")}
                    className="hover:text-foreground transition-colors"
                  >
                    {t.footer.links.marketplace}
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="hover:text-foreground transition-colors">
                    {t.footer.links.pricing}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">{t.footer.companySection}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/about" className="hover:text-foreground transition-colors">
                    {t.footer.links.about}
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-foreground transition-colors">
                    {t.footer.links.blog}
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-foreground transition-colors">
                    {t.footer.links.careers}
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-foreground transition-colors">
                    {t.footer.links.contact}
                  </a>
                </li>
                <li>
                  <a href="/faq" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/docs" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">{t.footer.legalSection}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/privacy" className="hover:text-foreground transition-colors">
                    {t.footer.links.privacy}
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-foreground transition-colors">
                    {t.footer.links.terms}
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="hover:text-foreground transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#security"
                    onClick={(e) => handleNavClick(e, "#security")}
                    className="hover:text-foreground transition-colors"
                  >
                    {t.footer.links.security}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t.footer.copyright}</p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#e879f9] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Twitter">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#e879f9] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="GitHub">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#e879f9] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <WaitlistModal isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </>
  )
}
