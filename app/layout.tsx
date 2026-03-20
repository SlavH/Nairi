import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
import "./globals.css"
import { I18nProvider } from "@/lib/i18n/context"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { NavOverlayWrapper } from "@/components/nav-overlay-wrapper"
import { TopProgressBar } from "@/components/top-progress-bar"

const _inter = Inter({ subsets: ["latin", "cyrillic"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", /* iOS: safe-area-inset-* work so chat input isn't behind home indicator */
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nairi.ai'),
  title: {
    default: "Nairi — Reality Executor",
    template: "%s | Nairi AI"
  },
  description:
    "Nairi is an autonomous intelligent system that transforms thought into reality. One thought. One message. Complete result.",
  keywords: ["AI assistant", "code generator", "AI development", "automation", "GPT-4", "Claude", "AI builder"],
  authors: [{ name: "Nairi AI" }],
  creator: "Nairi AI",
  publisher: "Nairi AI",
  generator: "Next.js",
  applicationName: "Nairi AI",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nairi.ai",
    siteName: "Nairi AI",
    title: "Nairi — Reality Executor",
    description: "Nairi is an autonomous intelligent system that transforms thought into reality. One thought. One message. Complete result.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nairi AI - Advanced AI Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nairi — Reality Executor",
    description: "Nairi is an autonomous intelligent system that transforms thought into reality.",
    creator: "@NairiAI",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/jpeg", sizes: "any" },
      { url: "/images/nairi-logo-header.jpg", type: "image/jpeg", sizes: "any" },
    ],
    apple: "/icon",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider>
              {children}
            </I18nProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Toaster richColors position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  )
}
