"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FavoriteButtonProps {
  creationId: string
  initialFavorite: boolean
  variant?: "icon" | "full"
}

export function FavoriteButton({ creationId, initialFavorite, variant = "icon" }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("creations")
        .update({ is_favorite: !isFavorite })
        .eq("id", creationId)

      if (error) throw error

      setIsFavorite(!isFavorite)
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update favorite status")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === "full") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggleFavorite}
        disabled={isLoading}
        className="bg-transparent"
      >
        <Star
          className={`h-4 w-4 mr-2 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
        />
        {isFavorite ? "Favorited" : "Favorite"}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
      className="h-8 w-8 bg-transparent"
    >
      <Star
        className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
      />
    </Button>
  )
}
