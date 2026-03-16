// Utility for exporting generated projects as downloadable ZIP files

interface GeneratedFile {
  path: string
  content: string
  type: string
}

interface ProjectConfig {
  name: string
  description?: string
  files: GeneratedFile[]
}

// Generate package.json for the project
function generatePackageJson(name: string, description?: string): string {
  const packageJson = {
    name: name.toLowerCase().replace(/\s+/g, "-"),
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
      "react-dom": "^18.2.0"
    },
    devDependencies: {
      "@types/node": "^20.0.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "typescript": "^5.0.0",
      "tailwindcss": "^3.4.0",
      "postcss": "^8.4.0",
      "autoprefixer": "^10.4.0"
    }
  }
  
  if (description) {
    Object.assign(packageJson, { description })
  }
  
  return JSON.stringify(packageJson, null, 2)
}

// Generate tsconfig.json
function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2)
}

// Generate tailwind.config.ts
function generateTailwindConfig(): string {
  return `import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
`
}

// Generate postcss.config.js
function generatePostcssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
}

// Generate next.config.js
function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`
}

// Generate default globals.css if not provided
function generateGlobalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 0, 0, 0;
  --background-end-rgb: 0, 0, 0;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
    to bottom,
    transparent,
    rgb(var(--background-end-rgb))
  ) rgb(var(--background-start-rgb));
}
`
}

// Generate default layout if not provided
function generateDefaultLayout(projectName: string): string {
  return `import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`
}

// Create a complete project structure
export function createProjectStructure(config: ProjectConfig): GeneratedFile[] {
  const { name, description, files } = config
  const allFiles: GeneratedFile[] = []
  
  // Add config files
  allFiles.push({
    path: "package.json",
    content: generatePackageJson(name, description),
    type: "config"
  })
  
  allFiles.push({
    path: "tsconfig.json",
    content: generateTsConfig(),
    type: "config"
  })
  
  allFiles.push({
    path: "tailwind.config.ts",
    content: generateTailwindConfig(),
    type: "config"
  })
  
  allFiles.push({
    path: "postcss.config.js",
    content: generatePostcssConfig(),
    type: "config"
  })
  
  allFiles.push({
    path: "next.config.js",
    content: generateNextConfig(),
    type: "config"
  })
  
  // Check if globals.css is provided
  const hasGlobalsCss = files.some(f => f.path.includes("globals.css"))
  if (!hasGlobalsCss) {
    allFiles.push({
      path: "app/globals.css",
      content: generateGlobalsCss(),
      type: "style"
    })
  }
  
  // Check if layout is provided
  const hasLayout = files.some(f => f.path.includes("layout.tsx") || f.path.includes("layout.jsx"))
  if (!hasLayout) {
    allFiles.push({
      path: "app/layout.tsx",
      content: generateDefaultLayout(name),
      type: "layout"
    })
  }
  
  // Add README
  allFiles.push({
    path: "README.md",
    content: generateReadme(name, description),
    type: "doc"
  })
  
  // Add all user-generated files
  allFiles.push(...files)
  
  return allFiles
}

function generateReadme(name: string, description?: string): string {
  return `# ${name}

${description || "A project generated with Nairi Builder"}

## Getting Started

First, install the dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Generated with Nairi Builder

This project was automatically generated using AI. Visit [Nairi](https://nairi.app) to create your own projects.
`
}

// Client-side function to create and download ZIP
export async function downloadProjectAsZip(config: ProjectConfig): Promise<void> {
  const files = createProjectStructure(config)
  
  // Dynamically import JSZip only on client
  const JSZip = (await import("jszip")).default
  const zip = new JSZip()
  
  // Add all files to the ZIP
  for (const file of files) {
    zip.file(file.path, file.content)
  }
  
  // Generate the ZIP
  const blob = await zip.generateAsync({ type: "blob" })
  
  // Download
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${config.name.toLowerCase().replace(/\s+/g, "-")}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Generate a shareable preview URL
export function generatePreviewUrl(files: GeneratedFile[]): string {
  // Create a data URL with the project structure
  const projectData = JSON.stringify(files)
  const encoded = btoa(encodeURIComponent(projectData))
  return `/builder/preview?data=${encoded}`
}
