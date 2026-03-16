"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, CreditCard, Zap, Check, Download, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ProductPurchaseButtonProps {
  productId: string
  title: string
  priceCents: number
  fullContent: string | null
  fileUrl: string | null
  owned: boolean
  userId: string | null
}

export function ProductPurchaseButton({
  productId,
  title,
  priceCents,
  fullContent,
  fileUrl,
  owned,
  userId,
}: ProductPurchaseButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "stripe" | null>(null)
  const [showContent, setShowContent] = useState(false)

  const { data: credits } = useSWR(userId ? "/api/credits" : null, fetcher)
  const creditCost = Math.ceil(priceCents / 10)
  const hasEnoughCredits = (credits?.balance ?? 0) >= creditCost

  const handlePurchase = async (useCredits: boolean) => {
    setIsLoading(true)
    setPaymentMethod(useCredits ? "credits" : "stripe")
    try {
      const res = await fetch(`/api/marketplace/products/${productId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCredits }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Purchase failed")
      toast.success(priceCents === 0 ? "Added to your library!" : `Purchased! ${data.creditsSpent ? `-${data.creditsSpent} credits` : ""}`)
      setShowPaymentModal(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed")
    } finally {
      setIsLoading(false)
      setPaymentMethod(null)
    }
  }

  const handleClick = () => {
    if (owned) {
      setShowContent(true)
      return
    }
    if (!userId) {
      router.push("/auth/login")
      return
    }
    if (priceCents === 0) {
      handlePurchase(false)
    } else {
      setShowPaymentModal(true)
    }
  }

  if (!userId && !owned) {
    return (
      <Button asChild className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
      <a href="/auth/login">Sign in to get this</a>
      </Button>
    )
  }

  if (owned) {
    return (
      <>
        <Button
          onClick={handleClick}
          className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
        >
          View content
        </Button>
        <Dialog open={showContent} onOpenChange={setShowContent}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>Your purchased content</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {fullContent ? (
                <div className="rounded-lg bg-white/5 border border-white/20 p-4">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">{fullContent}</pre>
                </div>
              ) : null}
              {fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#00c9c8] hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download / Open file
                </a>
              ) : null}
              {!fullContent && !fileUrl && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  No full content or file linked for this product.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading && !showPaymentModal}
        className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
      >
        {isLoading && !showPaymentModal ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : priceCents === 0 ? (
          "Get for free"
        ) : (
          `Purchase — $${(priceCents / 100).toFixed(2)}`
        )}
      </Button>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose payment</DialogTitle>
            <DialogDescription>
              {title} — ${(priceCents / 100).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <button
              onClick={() => handlePurchase(true)}
              disabled={!hasEnoughCredits || isLoading}
              className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${
                hasEnoughCredits ? "border-[#e879f9]/50 hover:border-[#e879f9] hover:bg-[#e879f9]/5" : "border-border opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#e879f9]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Credits</p>
                <p className="text-sm text-muted-foreground">{creditCost} credits · Balance: {credits?.balance ?? 0}</p>
              </div>
              {paymentMethod === "credits" && isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : hasEnoughCredits ? <Check className="h-5 w-5 text-[#e879f9]" /> : null}
            </button>
            <button
              onClick={() => handlePurchase(false)}
              disabled={isLoading}
              className="w-full p-4 rounded-xl border border-border hover:border-[#22d3ee] hover:bg-[#22d3ee]/5 text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#22d3ee]" />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <p className="font-medium text-foreground">Card (Stripe)</p>
                <ComingSoonBadge />
              </div>
            </button>
          </div>
          {!hasEnoughCredits && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              <a href="/dashboard/earn" className="text-[#e879f9] hover:underline">Earn credits</a>
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
