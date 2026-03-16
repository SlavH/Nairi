"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-muted-foreground mb-8">Last updated: January 18, 2026</p>
          
          <div className="prose dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Nairi, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. By using Nairi, you consent to the data practices described in this statement.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">2.1 Personal Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Email address and name when you create an account</li>
                <li>Payment information when you subscribe to paid plans</li>
                <li>Profile information you choose to provide</li>
              </ul>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">2.2 Usage Data</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Conversations and interactions with our AI systems</li>
                <li>Content you create using our platform</li>
                <li>Device information and IP addresses</li>
                <li>Usage patterns and feature interactions</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Personalize your experience and provide tailored content</li>
                <li>Communicate with you about updates, features, and support</li>
                <li>Ensure the security and integrity of our platform</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information. Your data is stored on secure servers with encryption at rest and in transit. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. AI and Data Processing</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your interactions with Nairi AI may be used to improve our services. You have control over:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>What information Nairi remembers about you</li>
                <li>How long your conversation history is retained</li>
                <li>Whether your data is used for AI training (you can opt out)</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience. You can control cookie preferences through your browser settings. Essential cookies are required for the platform to function properly.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services for analytics, payment processing, and other functions. These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at privacy@nairi.ai or through our Contact page.
              </p>
            </section>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
