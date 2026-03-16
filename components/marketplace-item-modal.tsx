"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, Download, Eye, User } from "lucide-react"

interface MarketplaceItem {
  name: string
  creator: string
  type: string
  price: string
  description?: string
  downloads?: number
  rating?: number
  reviews?: number
}

interface MarketplaceItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: MarketplaceItem | null
}

export function MarketplaceItemModal({ isOpen, onClose, item }: MarketplaceItemModalProps) {
  if (!item) return null

  const extendedItem = {
    ...item,
    description:
      item.description ||
      "A professionally crafted template designed to help you achieve results faster. Built with Nairi's intelligent execution engine.",
    downloads: item.downloads || Math.floor(Math.random() * 5000) + 500,
    rating: item.rating || 4.5 + Math.random() * 0.5,
    reviews: item.reviews || Math.floor(Math.random() * 200) + 50,
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background border-border">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-[#e879f9]/30 to-[#22d3ee]/30 flex items-center justify-center shrink-0">
              <span className="text-2xl">✦</span>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">{extendedItem.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{extendedItem.creator}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-[#22d3ee]">{extendedItem.type}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Eye className="w-8 h-8" />
            </div>
          </div>

          <DialogDescription className="text-base">{extendedItem.description}</DialogDescription>

          <div className="flex items-center gap-6 mt-4 py-4 border-y border-border">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#e879f9] text-[#e879f9]" />
              <span className="font-medium">{extendedItem.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({extendedItem.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Download className="w-4 h-4" />
              <span className="text-sm">{extendedItem.downloads.toLocaleString()} downloads</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              <span className="text-2xl font-bold gradient-text">{extendedItem.price}</span>
              <span className="text-sm text-muted-foreground ml-2">one-time</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-border bg-transparent">
                Preview
              </Button>
              <Button className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90">
                Get Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
