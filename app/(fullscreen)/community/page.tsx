import { Building2, FolderGit2, Users } from "lucide-react"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"

const sections = [
  {
    href: "/community/projects",
    title: "Projects",
    description: "Discover and collaborate on community-built projects.",
    icon: FolderGit2,
    accent: "#00c9c8",
  },
  {
    href: "/community/people",
    title: "People",
    description: "Meet the makers and creators building with Nairi.",
    icon: Users,
    accent: "#e052a0",
  },
  {
    href: "/community/companies",
    title: "Companies",
    description: "Explore companies and teams shaping the community.",
    icon: Building2,
    accent: "#a78bfa",
  },
]

export default function CommunityLandingPage() {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-[#e052a0]" />
          Community
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Projects, People, and Companies — explore what the community is building.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mt-4">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card className="bg-white/5 backdrop-blur-md border-white/20 hover:border-white/40 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6 flex flex-col items-start text-left gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: section.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
