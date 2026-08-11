import { CapabilitiesSection } from "@/components/capabilities-section"
import { Footer } from "@/components/footer"
import { FutureSection } from "@/components/future-section"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { LimitsSection } from "@/components/limits-section"
import { MarketplaceSection } from "@/components/marketplace-section"
import { SecuritySection } from "@/components/security-section"

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <CapabilitiesSection />
      <MarketplaceSection />
      <LimitsSection />
      <SecuritySection />
      <FutureSection />
      <Footer />
    </main>
  )
}
