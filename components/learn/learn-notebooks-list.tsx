"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface Notebook {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface LearnNotebooksListProps {
  initialNotebooks: Notebook[]
  showCreateButton?: boolean
}

export function LearnNotebooksList({ initialNotebooks, showCreateButton }: LearnNotebooksListProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/learn/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled NairiBook" }),
      })
      const text = await res.text()
      let data: { notebook?: { id?: string }; error?: string } = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          // non-JSON response (e.g. HTML error page)
        }
      }
      if (data.notebook?.id) {
        toast.success("NairiBook created")
        router.push(`/learn/notebooks/${data.notebook.id}`)
        router.refresh()
      } else if (res.status >= 400) {
        const msg = data.error || (res.status === 401 ? "Please sign in." : "Failed to create NairiBook.")
        toast.error(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={creating}
      className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90 shrink-0"
    >
      <Plus className="h-4 w-4 mr-2" />
      {creating ? "Creating…" : "New NairiBook"}
    </Button>
  )
}
