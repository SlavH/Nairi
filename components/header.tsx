"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n/context"

export function Header() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navItems = [
    { label: t.nav.howItWorks, href: "#how-it-works" },
    { label: t.nav.capabilities, href: "#capabilities" },
    { label: t.nav.marketplace, href: "#marketplace" },
    { label: t.nav.security, href: "#security" },
    { label: t.nav.builder, href: "/builder", isPage: true },
    { label: t.nav.docs, href: "/docs", isPage: true },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isPage?: boolean) => {
    if (isPage) {
      setIsOpen(false)
      return
    }
    if (href.startsWith("#")) {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Skip Navigation Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {t.common.skipToMainContent}
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-lg" : "bg-transparent"
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink" onClick={() => setIsOpen(false)}>
            <Image
              src="/images/nairi-logo-header.jpg"
              alt="Nairi Logo"
              width={40}
              height={40}
              className="rounded-full shrink-0 h-10 w-10 object-cover aspect-square"
            />
            <span className="text-xl font-semibold gradient-text truncate max-w-[6rem] sm:max-w-[8rem] md:max-w-none">Nairi</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 shrink-0" aria-label="Main navigation">
            {navItems.map((item) => (
              item.isPage ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={item.href === "/docs" ? "docs-nav-link" : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/auth/login">{t.common.signIn}</Link>
            </Button>
            <Button className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90" asChild>
              <Link href="/auth/sign-up">{t.common.getStarted}</Link>
            </Button>
          </div>

          <button
            className="md:hidden text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label={isOpen ? t.common.closeNavigation : t.common.openNavigationMenu}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-nav" className="md:hidden bg-background border-b border-border" role="navigation" aria-label="Mobile navigation">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {navItems.map((item) => (
              item.isPage ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center px-2 rounded-md hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                  data-testid={item.href === "/docs" ? "docs-nav-link-mobile" : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center px-2 rounded-md hover:bg-muted"
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {item.label}
                </a>
              )
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <div className="flex justify-center mb-2">
                <LanguageSwitcher />
              </div>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  {t.common.signIn}
                </Link>
              </Button>
              <Button className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background" asChild>
                <Link href="/auth/sign-up" onClick={() => setIsOpen(false)}>
                  {t.common.getStarted}
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  )
}
