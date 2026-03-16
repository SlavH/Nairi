"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Cookie <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-muted-foreground mb-8">Last updated: January 18, 2026</p>
          
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site. Cookies help us enhance your experience on Nairi by remembering your preferences and understanding how you use our platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nairi uses cookies for several purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>To keep you signed in to your account</li>
                <li>To remember your preferences and settings</li>
                <li>To understand how you use our platform</li>
                <li>To improve our services based on usage patterns</li>
                <li>To provide personalized experiences</li>
                <li>To ensure security and prevent fraud</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">3.1 Essential Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, account authentication, and session management. You cannot opt out of these cookies as the platform would not work without them.
              </p>
              <div className="bg-card/50 rounded-lg p-4 border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground">Cookie Name</th>
                      <th className="text-left py-2 text-foreground">Purpose</th>
                      <th className="text-left py-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">nairi_session</td>
                      <td className="py-2">User authentication</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">nairi_csrf</td>
                      <td className="py-2">Security token</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2">sb-*</td>
                      <td className="py-2">Supabase authentication</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">3.2 Functional Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we use. If you disable these cookies, some features may not work properly.
              </p>
              <div className="bg-card/50 rounded-lg p-4 border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground">Cookie Name</th>
                      <th className="text-left py-2 text-foreground">Purpose</th>
                      <th className="text-left py-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">nairi_locale</td>
                      <td className="py-2">Language preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">nairi_theme</td>
                      <td className="py-2">Theme preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2">nairi_chat_mode</td>
                      <td className="py-2">Last used chat mode</td>
                      <td className="py-2">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">3.3 Analytics Cookies</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our platform.
              </p>
              <div className="bg-card/50 rounded-lg p-4 border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground">Cookie Name</th>
                      <th className="text-left py-2 text-foreground">Purpose</th>
                      <th className="text-left py-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">_ga</td>
                      <td className="py-2">Google Analytics tracking</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr>
                      <td className="py-2">_gid</td>
                      <td className="py-2">Google Analytics session</td>
                      <td className="py-2">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Some cookies are placed by third-party services that appear on our pages. We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Supabase:</strong> Authentication and database services</li>
                <li><strong className="text-foreground">Stripe:</strong> Payment processing (only on checkout pages)</li>
                <li><strong className="text-foreground">Google Analytics:</strong> Usage analytics and insights</li>
                <li><strong className="text-foreground">Vercel:</strong> Hosting and performance optimization</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can control and manage cookies in several ways:
              </p>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">5.1 Browser Settings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites. The settings are usually found in the &quot;options&quot; or &quot;preferences&quot; menu of your browser.
              </p>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">5.2 Our Cookie Settings</h3>
              <p className="text-muted-foreground leading-relaxed">
                You can adjust non-essential cookie preferences in your Account Settings under Privacy Preferences. Note that disabling certain cookies may affect your experience on Nairi.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you choose to disable cookies, you may experience the following:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Inability to stay logged in to your account</li>
                <li>Loss of personalized settings and preferences</li>
                <li>Reduced functionality in certain features</li>
                <li>Need to re-enter information more frequently</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes by posting a notice on our website.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us at privacy@nairi.ai or visit our Contact page.
              </p>
            </section>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
