"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useTranslation } from "@/lib/i18n/context"
import { Users, Target, Lightbulb, Globe } from "lucide-react"

export default function AboutPage() {
  const { t } = useTranslation()
  
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="gradient-text">Nairi</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Nairi is building the future of human-computer interaction. We believe that technology should amplify human potential, not complicate it.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We envision a world where the gap between thought and reality is eliminated. Where expressing an intention is enough to see it materialize. Nairi is not just another AI tool — it is a paradigm shift in how humans interact with technology.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is to democratize access to powerful AI capabilities, making advanced technology accessible to everyone regardless of their technical background.
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-4 text-foreground">The Name &quot;Nairi&quot;</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nairi is an ancient name for the Armenian Highlands, representing a land of innovation and culture. Just as the historic Nairi was a cradle of civilization, our Nairi aims to be the birthplace of a new era in human-AI collaboration.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mb-20">
            <div className="text-center p-6 rounded-2xl bg-card/50 border border-border">
              <div className="w-12 h-12 rounded-full bg-[#e879f9]/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-[#e879f9]" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Mission</h3>
              <p className="text-sm text-muted-foreground">Transform thoughts into reality with zero friction</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card/50 border border-border">
              <div className="w-12 h-12 rounded-full bg-[#22d3ee]/10 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-6 h-6 text-[#22d3ee]" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Innovation</h3>
              <p className="text-sm text-muted-foreground">Pioneering the reality executor paradigm</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card/50 border border-border">
              <div className="w-12 h-12 rounded-full bg-[#e879f9]/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#e879f9]" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Community</h3>
              <p className="text-sm text-muted-foreground">Building together through our marketplace</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card/50 border border-border">
              <div className="w-12 h-12 rounded-full bg-[#22d3ee]/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-[#22d3ee]" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Global</h3>
              <p className="text-sm text-muted-foreground">Accessible worldwide in multiple languages</p>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Join Us on This Journey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are at the beginning of a revolution in human-computer interaction. Whether you are a creator, developer, or visionary — there is a place for you in the Nairi ecosystem.
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
