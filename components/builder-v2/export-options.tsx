"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  FileArchive,
  Github,
  Globe,
  Code2,
  Copy,
  Check,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import type { ProjectFile } from "@/lib/builder-v2/types"

interface ExportOptionsProps {
  files: ProjectFile[]
  projectName?: string
}

export function ExportOptions({ files, projectName = "my-project" }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Download as ZIP
  const handleDownloadZip = async () => {
    setIsExporting(true)
    try {
      // Dynamic import JSZip to reduce bundle size
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      // Add all files to the zip (Next.js App Router structure)
      const hasLayout = files.some(f => f.path === "/app/layout.tsx" || f.path === "app/layout.tsx")
      const hasGlobalsCss = files.some(f => f.path === "/app/globals.css" || f.path === "app/globals.css")
      for (const file of files) {
        const filePath = file.path.startsWith("/") ? file.path.slice(1) : file.path
        zip.file(filePath, file.content)
      }
      if (!hasLayout) {
        zip.file("app/layout.tsx", `import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Generated with Nairi Builder",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`)
      }
      if (!hasGlobalsCss) {
        zip.file("app/globals.css", `@tailwind base;
@tailwind components;
@tailwind utilities;
`)
      }

      // Add package.json
      const packageJson = {
        name: projectName,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          "next": "^14.0.0",
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "tailwindcss": "^3.3.0",
          "lucide-react": "^0.300.0"
        },
        devDependencies: {
          "@types/node": "^20",
          "@types/react": "^18",
          "@types/react-dom": "^18",
          "typescript": "^5"
        }
      }
      zip.file("package.json", JSON.stringify(packageJson, null, 2))

      // Ensure app directory exists and add Next.js config for runnable export
      zip.file("next.config.js", `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}
module.exports = nextConfig
`)

      zip.file("tsconfig.json", JSON.stringify({
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          module: "esnext",
          esModuleInterop: true,
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"]
      }, null, 2))

      zip.file("postcss.config.js", `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`)

      zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
`)

      // Add README
      const readme = `# ${projectName}

Generated with Nairi Builder V2

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your project.

## Built With

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
`
      zip.file("README.md", readme)

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${projectName}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("ZIP ready! Run npm install && npm run dev to start locally, or import the ZIP at vercel.com/new to deploy.")
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Failed to export project")
    } finally {
      setIsExporting(false)
    }
  }

  // Copy all code to clipboard
  const handleCopyCode = async () => {
    try {
      const allCode = files
        .map(f => `// ${f.path}\n${f.content}`)
        .join("\n\n" + "=".repeat(50) + "\n\n")
      
      await navigator.clipboard.writeText(allCode)
      setCopied(true)
      toast.success("Code copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy code")
    }
  }

  // Open in CodeSandbox
  const handleOpenCodeSandbox = () => {
    // Create CodeSandbox parameters
    const parameters = {
      files: files.reduce((acc, file) => {
        const path = file.path.startsWith("/") ? file.path.slice(1) : file.path
        acc[path] = { content: file.content }
        return acc
      }, {} as Record<string, { content: string }>)
    }

    // Encode and open
    const encoded = btoa(JSON.stringify(parameters))
    window.open(`https://codesandbox.io/api/v1/sandboxes/define?parameters=${encoded}`, "_blank")
    toast.success("Opening in CodeSandbox...")
  }

  // Deploy to Vercel: open Vercel import page; user can upload the downloaded ZIP or connect repo
  const handleDeployVercel = () => {
    window.open("https://vercel.com/new", "_blank")
    toast.info("Download the project ZIP first, then import it at Vercel (vercel.com/new) to deploy.")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 min-h-[44px] min-w-[44px] sm:min-w-0">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[85vh] overflow-y-auto">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDownloadZip} disabled={isExporting}>
          <FileArchive className="h-4 w-4 mr-2" />
          Download as ZIP (npm install && npm run dev)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleCopyCode}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copy All Code
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Open In</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={handleOpenCodeSandbox}>
          <Code2 className="h-4 w-4 mr-2" />
          CodeSandbox
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Deploy</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={handleDeployVercel}>
          <Globe className="h-4 w-4 mr-2" />
          Deploy to Vercel
        </DropdownMenuItem>
        
        <DropdownMenuItem disabled>
          <Github className="h-4 w-4 mr-2" />
          Push to GitHub
          <span className="ml-auto text-xs text-muted-foreground">Soon</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
