"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Target, Compass, Lightbulb, ArrowRight, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface PurposeCheckProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPurpose: (purpose: string) => void
  context?: string
}

export function PurposeCheck({ isOpen, onClose, onConfirmPurpose, context }: PurposeCheckProps) {
  const t = useTranslation()
  const [purpose, setPurpose] = useState("")
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  const suggestedGoals = [
    { id: "learn", icon: Lightbulb, label: "Learning something new" },
    { id: "solve", icon: Target, label: "Solving a specific problem" },
    { id: "explore", icon: Compass, label: "Exploring ideas" },
    { id: "create", icon: ArrowRight, label: "Creating something" },
  ]

  const handleConfirm = () => {
    const finalPurpose = purpose || selectedGoal || "General exploration"
    onConfirmPurpose(finalPurpose)
    onClose()
    setPurpose("")
    setSelectedGoal(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t.cognitive.whyDoingThis}
          </DialogTitle>
          <DialogDescription>{t.cognitive.purposeCheck}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Context */}
          {context && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">Current activity:</p>
              <p className="font-medium">{context}</p>
            </div>
          )}

          {/* Quick Goals */}
          <div className="space-y-2">
            <p className="text-sm font-medium">What's your goal?</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className={`cursor-pointer transition-all ${
                    selectedGoal === goal.id ? "border-primary bg-primary/5" : "hover:border-border/80"
                  }`}
                  onClick={() => setSelectedGoal(goal.id)}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <goal.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{goal.label}</span>
                    {selectedGoal === goal.id && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Purpose */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Or describe in your own words:</p>
            <Textarea
              placeholder="I want to..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Skip for now
          </Button>
          <Button onClick={handleConfirm} className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirm Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to trigger purpose checks periodically
export function usePurposeCheck(intervalMinutes = 30) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionStart] = useState(Date.now())

  const checkPurpose = () => {
    const elapsed = (Date.now() - sessionStart) / 1000 / 60
    if (elapsed > intervalMinutes) {
      setIsOpen(true)
    }
  }

  return {
    isOpen,
    openCheck: () => setIsOpen(true),
    closeCheck: () => setIsOpen(false),
    checkPurpose,
  }
}
