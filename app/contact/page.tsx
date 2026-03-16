"use client"

import React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessibleInput } from "@/components/ui/accessible-input"
import { AccessibleTextarea } from "@/components/ui/accessible-textarea"
import { AccessibleSelect } from "@/components/ui/accessible-select"
import { Mail, MessageSquare, Building, HelpCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const contactReasons = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "sales", label: "Sales & Enterprise" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press & Media" },
  { value: "feedback", label: "Product Feedback" },
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success("Message sent successfully! We'll get back to you soon.")
    setFormData({ name: "", email: "", reason: "", subject: "", message: "" })
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Have questions, feedback, or want to explore partnerships? We&apos;d love to hear from you.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Send us a message</CardTitle>
                  <CardDescription>Fill out the form below and we&apos;ll respond within 24-48 hours.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <AccessibleInput
                        label="Name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoComplete="name"
                        className="bg-background/50"
                      />
                      <AccessibleInput
                        label="Email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        autoComplete="email"
                        className="bg-background/50"
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <AccessibleSelect
                        label="Reason for contact"
                        value={formData.reason}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, reason: e.target.value })}
                        className="bg-background/50"
                      >
                        <option value="" disabled>Select a reason</option>
                        {contactReasons.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </AccessibleSelect>
                      <AccessibleInput
                        label="Subject"
                        placeholder="Brief subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    
                    <AccessibleTextarea
                      label="Message"
                      placeholder="Tell us how we can help..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="bg-background/50"
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#e879f9]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#e879f9]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Email Us</h3>
                      <p className="text-sm text-muted-foreground mb-2">For general inquiries</p>
                      <a href="mailto:hello@nairi.ai" className="text-[#e879f9] hover:underline text-sm">hello@nairi.ai</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#22d3ee]/10 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5 text-[#22d3ee]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Support</h3>
                      <p className="text-sm text-muted-foreground mb-2">Technical assistance</p>
                      <a href="mailto:support@nairi.ai" className="text-[#22d3ee] hover:underline text-sm">support@nairi.ai</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#e879f9]/10 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-[#e879f9]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Enterprise</h3>
                      <p className="text-sm text-muted-foreground mb-2">Sales & partnerships</p>
                      <a href="mailto:sales@nairi.ai" className="text-[#e879f9] hover:underline text-sm">sales@nairi.ai</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#22d3ee]/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-[#22d3ee]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Community</h3>
                      <p className="text-sm text-muted-foreground mb-2">Join our Discord</p>
                      <span className="text-[#22d3ee] text-sm">discord.gg/nairi</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
