/**
 * Builder page constants: initial files and viewport sizes.
 */

import type { ProjectFile, ViewportSize } from "./types"

export const VIEWPORT_SIZES: Record<ViewportSize, { width: number; label: string }> = {
  mobile: { width: 375, label: "Mobile" },
  tablet: { width: 768, label: "Tablet" },
  desktop: { width: 1280, label: "Desktop" },
}

export const INITIAL_FILES: ProjectFile[] = [
  {
    id: "1",
    name: "page.tsx",
    path: "/app/page.tsx",
    content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Nairi Builder</h1>
      <p className="mt-4 text-muted-foreground">
        Describe what you want to build in the chat.
      </p>
    </main>
  )
}`,
    language: "typescript",
    isModified: false,
  },
  {
    id: "2",
    name: "layout.tsx",
    path: "/app/layout.tsx",
    content: `import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "My App",
  description: "Built with Nairi Builder",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
    language: "typescript",
    isModified: false,
  },
  {
    id: "3",
    name: "globals.css",
    path: "/app/globals.css",
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}`,
    language: "css",
    isModified: false,
  },
]
