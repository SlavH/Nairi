import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Nairi ("Service"), you agree to be bound by these Terms of Service.
              If you disagree with any part, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p>
              Nairi is an AI-powered platform providing chat, code generation, website building,
              and other AI-assisted tools. The Service uses third-party AI backends (OpenCode, Supabase, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p>
              To access certain features, you must register via Supabase Auth (Google OAuth or email).
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any illegal purpose</li>
              <li>Generate harmful, abusive, or discriminatory content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Reverse engineer or compromise the Service</li>
              <li>Use the Service to generate malware or harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Intellectual Property</h2>
            <p>
              You retain ownership of content you generate. By using the Service, you grant us a
              non-exclusive license to use, display, and process your content solely to provide the Service.
            </p>
            <p className="mt-2">
              AI-generated content is provided "as is". We make no warranties about its accuracy,
              completeness, or fitness for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
            <p>
              Nairi shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
              or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Third-Party Services</h2>
            <p>We use these third-party services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase</strong> — authentication, database (PostgreSQL)</li>
              <li><strong>Google OAuth</strong> — sign-in service</li>
              <li><strong>OpenCode (opencode-ai)</strong> — AI chat backend</li>
              <li><strong>Vercel</strong> — hosting and deployment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice, for any reason,
              including breach of these Terms. Upon termination, your right to use the Service stops immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Governing Law</h2>
            <p>
              These Terms shall be governed by Armenian law. Any disputes shall be subject to the
              exclusive jurisdiction of courts in Armenia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users via email
              or a notice on our website. Continued use after changes means you accept the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Us</h2>
            <p>
              For questions about these Terms, please contact us via{" "}
              <a href="https://github.com/SlavH/Nairi/issues" className="text-primary hover:underline">
                Nairi Issues on GitHub
              </a>
            </p>
          </section>

          <p className="text-sm mt-8 pt-4 border-t">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
