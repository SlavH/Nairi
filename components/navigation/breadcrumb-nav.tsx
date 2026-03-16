"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon as ChevronRight, HomeIcon as Home } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

const pathLabels: Record<string, string> = {
  "dashboard": "Dashboard",
  "chat": "Chat",
  "marketplace": "Marketplace",
  "workspace": "Workspace",
  "learn": "Learn",
  "flow": "Flow",
  "knowledge": "Knowledge",
  "debate": "Debate",
  "settings": "Settings",
  "billing": "Billing",
  "activity": "Activity",
  "traces": "Traces",
  "credits": "Credits",
  "notifications": "Notifications",
  "earn": "Earn Credits",
  "ai": "AI",
  "profile": "Profile",
  "search": "Search",
  "create": "Create",
  "creator": "Creator Dashboard",
  "courses": "Courses",
  "skill-tree": "Skill Tree",
  "auth": "Authentication",
  "login": "Login",
  "sign-up": "Sign Up",
  "forgot-password": "Forgot Password",
  "reset-password": "Reset Password",
  "checkout": "Checkout",
  "plan": "Plan",
  "about": "About",
  "contact": "Contact",
  "blog": "Blog",
  "careers": "Careers",
  "pricing": "Pricing",
  "faq": "FAQ",
  "terms": "Terms of Service",
  "privacy": "Privacy Policy",
  "cookies": "Cookie Policy",
  "onboarding": "Onboarding",
}

interface BreadcrumbNavProps {
  className?: string
  showHome?: boolean
  customItems?: BreadcrumbItem[]
}

export function BreadcrumbNav({ className, showHome = true, customItems }: BreadcrumbNavProps) {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems
    
    const segments = pathname.split("/").filter(Boolean)
    
    if (segments.length === 0) return []
    
    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = ""
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      currentPath += `/${segment}`
      
      // Skip dynamic segments that look like IDs (UUIDs or numbers)
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || /^\d+$/.test(segment)
      
      if (isId) {
        // Replace with "Details" or similar
        breadcrumbs.push({
          label: "Details",
          href: i < segments.length - 1 ? currentPath : undefined
        })
      } else {
        const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
        breadcrumbs.push({
          label,
          href: i < segments.length - 1 ? currentPath : undefined
        })
      }
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  if (breadcrumbs.length === 0 && !showHome) return null
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center gap-1">
        {showHome && (
          <li className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            {breadcrumbs.length > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" aria-hidden="true" />
            )}
          </li>
        )}
        
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? (
              <>
                <Link 
                  href={item.href}
                  className="hover:text-foreground transition-colors px-1 py-0.5 rounded-md hover:bg-muted"
                >
                  {item.label}
                </Link>
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" aria-hidden="true" />
              </>
            ) : (
              <span className="text-foreground font-medium px-1" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
