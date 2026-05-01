import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <p>
              We collect information you provide directly (email, profile data) and information
              automatically (usage data, IP address, cookies) when you use Nairi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide and maintain our service</li>
              <li>Authenticate you via Supabase Auth and Google OAuth</li>
              <li>Process your AI requests via OpenCode and other backends</li>
              <li>Send you important updates and security alerts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Storage</h2>
            <p>
              Your data is stored securely in Supabase (PostgreSQL database with Row Level Security).
              Session data for OpenCode is stored temporarily and cleaned up after 6 hours.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Services</h2>
            <p>We use:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase</strong> — authentication and database</li>
              <li><strong>Google OAuth</strong> — sign-in service</li>
              <li><strong>OpenCode (opencode-ai)</strong> — AI chat backend</li>
              <li><strong>Vercel</strong> — hosting and deployment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Your Rights</h2>
            <p>You can:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access your data via your profile page</li>
              <li>Delete your account (contact us)</li>
              <li>Request data export (GDPR)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contact Us</h2>
            <p>
              For privacy questions: contact us via GitHub{" "}
              <a href="https://github.com/SlavH/Nairi/issues" className="text-primary hover:underline">
                Nairi Issues
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
