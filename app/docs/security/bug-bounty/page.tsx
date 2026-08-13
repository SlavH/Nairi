import { ArrowLeft, CheckCircle2, Shield } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Bug Bounty Program | Nairi Documentation",
  description: "Help keep Nairi secure and earn rewards for qualifying vulnerabilities.",
}

const tiers = [
  {
    severity: "Critical",
    reward: "$2,000 - $5,000",
    examples: "Remote code execution, authentication bypass, mass account compromise, or direct access to production data.",
  },
  {
    severity: "High",
    reward: "$500 - $2,000",
    examples: "Privilege escalation, significant data exposure, or cross-site scripting with meaningful impact.",
  },
  {
    severity: "Medium",
    reward: "$150 - $500",
    examples: "CSRF on sensitive actions, stored XSS in restricted scopes, or moderate information disclosure.",
  },
  {
    severity: "Low",
    reward: "Recognition",
    examples: "Minor CSRF, self-XSS, or low-impact information disclosure.",
  },
]

const rules = [
  "Only test accounts you own. Never target other users' accounts or data.",
  "Do not attempt to access, modify, or delete data you do not own.",
  "Do not use automated scanners or tools that could disrupt the service or its users.",
  "Do not publicly disclose a vulnerability before it has been fixed.",
  "Report your finding privately using the email below, then wait for our response.",
]

export default function BugBountyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Link>
          <Badge className="bg-[#22d3ee]/10 text-[#22d3ee] border-0">
            <Shield className="w-3 h-3 mr-1" />
            Security
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <Badge className="mb-4 bg-[#e879f9]/10 text-[#e879f9] border-0">Responsible Disclosure</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Bug Bounty Program</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            We take security seriously and reward researchers who help us keep Nairi safe. If you
            find a vulnerability, report it responsibly and earn a bounty.
          </p>
        </div>

        <div className="space-y-12">
          <section className="max-w-3xl">
            <h2 className="text-xl font-semibold text-foreground mb-4">How to report</h2>
            <p className="text-muted-foreground mb-4">
              Send a detailed report to <strong className="text-foreground">security@nairi.app</strong>.
              Include the affected URL, a step-by-step reproduction, the impact, and any proof-of-concept.
            </p>
            <ul className="space-y-2">
              {rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#22d3ee] shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Rewards</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {tiers.map((tier) => (
                <Card key={tier.severity} className="bg-card/50 border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{tier.severity}</h3>
                      <Badge className="bg-[#22d3ee]/10 text-[#22d3ee] border-0">{tier.reward}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.examples}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="max-w-3xl">
            <h2 className="text-xl font-semibold text-foreground mb-4">Out of scope</h2>
            <p className="text-muted-foreground">
              Social engineering of Nairi staff, denial-of-service attacks, self-XSS, and issues in
              third-party services we rely on are not eligible. Duplicate reports are honored only
              for the first complete submission.
            </p>
          </section>
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
            <Link href="/docs/security">
              Learn about our security
              <Shield className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
