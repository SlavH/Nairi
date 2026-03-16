import type { Metadata } from "next"
import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Community | Nairi",
  description: "Community — Projects, People, Companies",
}

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { user } = await supabase.auth.getUser().then((r) => r.data)
  if (!user) redirect("/auth/login")

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-950 via-pink-950 to-cyan-950">
      <div className="h-full w-full p-2 sm:p-3 md:p-4">
        <div className="h-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
          <header className="flex items-center gap-4 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shrink-0">
            <Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/10" asChild>
              <Link href="/nav" aria-label="Back to navigation">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/nav" className="flex items-center gap-2 min-w-0">
              <Image
                src="/images/nairi-logo-header.jpg"
                alt="Nairi"
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg border border-white/20 shrink-0"
              />
              <span className="font-bold text-sm sm:text-base bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent truncate">
                Community
              </span>
            </Link>
          </header>
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
