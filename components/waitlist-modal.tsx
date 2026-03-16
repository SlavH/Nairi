"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Sparkles, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setIsSuccess(true)
  }

  const handleClose = () => {
    onClose()
    // Reset state after modal closes
    setTimeout(() => {
      setIsSuccess(false)
      setEmail("")
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#e879f9]" />
                <DialogTitle className="gradient-text">{t.waitlist.title}</DialogTitle>
              </div>
              <DialogDescription>
                {t.waitlist.description}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="waitlist-email">{t.waitlist.emailLabel}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="waitlist-email"
                    type="email"
                    placeholder={t.waitlist.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted border-border"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 border border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{t.waitlist.earlyAccessBenefits}</span>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• {t.waitlist.benefits.priorityAccess}</li>
                  <li>• {t.waitlist.benefits.extendedLimits}</li>
                  <li>• {t.waitlist.benefits.exclusiveCommunity}</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t.waitlist.joinWaitlistButton}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-background" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.waitlist.successTitle}</h3>
            <p className="text-muted-foreground mb-6">{t.waitlist.successMessage}</p>
            <Button onClick={handleClose} variant="outline" className="border-border bg-transparent">
              {t.waitlist.closeButton}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
