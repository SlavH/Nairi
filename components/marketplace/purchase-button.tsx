"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, CreditCard, Zap, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import useSWR from "swr"

interface Agent {
  id: string
  name: string
  price_cents: number
  is_free: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function PurchaseButton({ agent, userId }: { agent: Agent; userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "stripe" | null>(null)
  const router = useRouter()
  
  const { data: credits } = useSWR("/api/credits", fetcher)
  
  const creditCost = Math.ceil(agent.price_cents / 10) // 10 cents = 1 credit
  const hasEnoughCredits = (credits?.balance || 0) >= creditCost

  const handlePurchase = async (useCredits: boolean) => {
    setIsLoading(true)
    setPaymentMethod(useCredits ? "credits" : "stripe")

    try {
      const response = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          useCredits
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed")
      }

      if (data.checkoutUrl) {
        // Redirect to Stripe
        window.location.href = data.checkoutUrl
        return
      }

      // Success with credits or free
      toast.success(agent.is_free ? "Agent added!" : `Agent purchased! ${data.creditsSpent ? `-${data.creditsSpent} credits` : ""}`)
      setShowPaymentModal(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Purchase failed")
    } finally {
      setIsLoading(false)
      setPaymentMethod(null)
    }
  }

  const handleClick = () => {
    if (agent.is_free || agent.price_cents === 0) {
      handlePurchase(false)
    } else {
      setShowPaymentModal(true)
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
      >
        {isLoading && !showPaymentModal ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : agent.is_free ? (
          "Get Free Agent"
        ) : (
          `Get Agent - $${(agent.price_cents / 100).toFixed(2)}`
        )}
      </Button>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Purchase {agent.name} for ${(agent.price_cents / 100).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            {/* Credits Option */}
            <button
              onClick={() => handlePurchase(true)}
              disabled={!hasEnoughCredits || isLoading}
              className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${
                hasEnoughCredits 
                  ? "border-[#e879f9]/50 hover:border-[#e879f9] hover:bg-[#e879f9]/5" 
                  : "border-border opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#e879f9]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Pay with Credits</p>
                <p className="text-sm text-muted-foreground">
                  {creditCost} credits required
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {credits?.balance?.toLocaleString() || 0} credits
                </p>
              </div>
              {paymentMethod === "credits" && isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#e879f9]" />
              ) : hasEnoughCredits ? (
                <Check className="h-5 w-5 text-[#e879f9]" />
              ) : null}
            </button>

            {/* Stripe Option */}
            <button
              onClick={() => handlePurchase(false)}
              disabled={isLoading}
              className="w-full p-4 rounded-xl border border-border hover:border-[#22d3ee] hover:bg-[#22d3ee]/5 transition-all text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#22d3ee]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Pay with Card</p>
                <p className="text-sm text-muted-foreground">
                  ${(agent.price_cents / 100).toFixed(2)} via Stripe
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Secure payment processing
                </p>
              </div>
              {paymentMethod === "stripe" && isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#22d3ee]" />
              ) : null}
            </button>
          </div>

          {!hasEnoughCredits && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Not enough credits?{" "}
              <a href="/dashboard/earn" className="text-[#e879f9] hover:underline">
                Earn more credits
              </a>
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
