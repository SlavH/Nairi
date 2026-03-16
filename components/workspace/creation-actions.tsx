"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Copy, Share2, MoreHorizontal, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Creation {
  id: string
  type: string
  prompt: string
  content: string
  created_at: string
}

export function CreationActions({ creation }: { creation: Creation }) {
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(creation.content)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadAsFile = () => {
    const fileExtension = creation.type === "code" ? "txt" : "md"
    const blob = new Blob([creation.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nairi-${creation.type}-${creation.id.slice(0, 8)}.${fileExtension}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded!")
  }

  const shareCreation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Nairi ${creation.type} Creation`,
          text: creation.prompt,
          url: window.location.href,
        })
      } catch {
        // User cancelled or share failed
        copyShareLink()
      }
    } else {
      copyShareLink()
    }
  }

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard!")
  }

  const deleteCreation = async () => {
    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("creations")
        .delete()
        .eq("id", creation.id)

      if (error) throw error

      toast.success("Creation deleted")
      router.push("/workspace")
    } catch {
      toast.error("Failed to delete creation")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="hidden sm:flex bg-transparent"
        >
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadAsFile}
          className="hidden sm:flex bg-transparent"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={shareCreation}
          className="hidden sm:flex bg-transparent"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="bg-transparent">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyToClipboard} className="sm:hidden">
              <Copy className="h-4 w-4 mr-2" />
              Copy Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadAsFile} className="sm:hidden">
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareCreation} className="sm:hidden">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Creation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              creation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCreation}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
