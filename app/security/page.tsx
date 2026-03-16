"use client"

import { Shield, Lock, Eye, Server, Key, FileCheck, Users, Globe, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit and at rest using AES-256 encryption. Your conversations and files are protected at every step."
  },
  {
    icon: Eye,
    title: "Privacy by Design",
    description: "We don't train on your data. Your conversations remain private and are never used to improve our models without explicit consent."
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Hosted on enterprise-grade cloud infrastructure with SOC 2 Type II compliance, regular security audits, and 99.9% uptime SLA."
  },
  {
    icon: Key,
    title: "Access Control",
    description: "Role-based access control (RBAC), SSO integration, and multi-factor authentication to protect your organization."
  },
  {
    icon: FileCheck,
    title: "Data Retention Control",
    description: "Full control over your data retention policies. Delete your data anytime with our data portability and deletion tools."
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Enterprise-grade team management with audit logs, user provisioning, and granular permission controls."
  }
]

const certifications = [
  { name: "SOC 2 Type II", status: "Certified" },
  { name: "GDPR", status: "Compliant" },
  { name: "CCPA", status: "Compliant" },
  { name: "HIPAA", status: "Available" },
  { name: "ISO 27001", status: "In Progress" }
]

const securityPractices = [
  "Regular penetration testing by third-party security firms",
  "Bug bounty program for responsible disclosure",
  "24/7 security monitoring and incident response",
  "Employee security training and background checks",
  "Secure development lifecycle (SDLC) practices",
  "Regular security audits and vulnerability assessments"
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={40} height={40} className="rounded-full" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
              Nairi
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 text-center">
        <Badge variant="outline" className="mb-4 border-cyan-500/50 text-cyan-400">
          <Shield className="w-3 h-3 mr-1" />
          Enterprise Security
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Security at{" "}
          <span className="bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
            Nairi
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Your trust is our priority. We implement industry-leading security measures 
          to protect your data and ensure privacy at every level.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-pink-500 to-cyan-500">
            <Link href="/contact">Contact Security Team</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/docs/security">Security Docs</Link>
          </Button>
        </div>
      </section>

      {/* Security Features */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Security Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="bg-card/50 border-border/50 hover:border-cyan-500/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Compliance & Certifications</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {certifications.map((cert, index) => (
            <Card key={index} className="bg-card/50 border-border/50 p-6 text-center min-w-[200px]">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">{cert.name}</span>
              </div>
              <Badge 
                variant={cert.status === "Certified" || cert.status === "Compliant" ? "default" : "secondary"}
                className={cert.status === "Certified" || cert.status === "Compliant" ? "bg-green-500/20 text-green-400" : ""}
              >
                {cert.status}
              </Badge>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Practices */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Security Practices</h2>
          <div className="space-y-4">
            {securityPractices.map((practice, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>{practice}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <Card className="bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border-0 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Have Security Questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Our security team is here to help. Reach out for security assessments, 
            compliance documentation, or to report vulnerabilities.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild className="bg-gradient-to-r from-pink-500 to-cyan-500">
              <Link href="mailto:security@nairi.ai">security@nairi.ai</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/security/bug-bounty">Bug Bounty Program</Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Nairi AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
