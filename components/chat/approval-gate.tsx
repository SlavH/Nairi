"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, AlertTriangle, CheckCircle2, Eye, Edit3 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

interface ApprovalAction {
  id: string
  type: "publish" | "automation" | "agent_execution" | "data_modification" | "external_api"
  title: string
  description: string
  impact: "low" | "medium" | "high"
  reversible: boolean
  details?: Record<string, string>
}

interface ApprovalGateProps {
  action: ApprovalAction
  isOpen: boolean
  onApprove: () => void
  onReject: () => void
  onModify?: () => void
}

export function ApprovalGate({ action, isOpen, onApprove, onReject, onModify }: ApprovalGateProps) {
  const t = useTranslation()
  const [hasReviewed, setHasReviewed] = useState(false)

  const getImpactColor = (impact: ApprovalAction["impact"]) => {
    switch (impact) {
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/30"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/30"
    }
  }

  const getTypeIcon = (type: ApprovalAction["type"]) => {
    switch (type) {
      case "publish":
        return <Eye className="h-5 w-5" />
      case "automation":
        return <Shield className="h-5 w-5" />
      case "agent_execution":
        return <AlertTriangle className="h-5 w-5" />
      case "data_modification":
        return <Edit3 className="h-5 w-5" />
      case "external_api":
        return <Shield className="h-5 w-5" />
    }
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t.trust.approvalRequired}
          </AlertDialogTitle>
          <AlertDialogDescription>{t.trust.reviewAction}</AlertDialogDescription>
        </AlertDialogHeader>

        <Card className="border-border/50">
          <CardContent className="p-4 space-y-4">
            {/* Action Header */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                {getTypeIcon(action.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{action.title}</h4>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </div>

            {/* Impact Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(getImpactColor(action.impact))}>
                {action.impact.toUpperCase()} IMPACT
              </Badge>
              {action.reversible ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Reversible
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Irreversible
                </Badge>
              )}
            </div>

            {/* Details */}
            {action.details && Object.keys(action.details).length > 0 && (
              <div className="text-sm space-y-1 p-3 rounded-lg bg-muted/50">
                {Object.entries(action.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Review Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reviewed"
                checked={hasReviewed}
                onCheckedChange={(checked) => setHasReviewed(checked as boolean)}
              />
              <label htmlFor="reviewed" className="text-sm text-muted-foreground cursor-pointer">
                I have reviewed this action and understand its implications
              </label>
            </div>
          </CardContent>
        </Card>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onReject}>{t.common.cancel}</AlertDialogCancel>
          {onModify && (
            <Button variant="outline" onClick={onModify} className="bg-transparent">
              <Edit3 className="h-4 w-4 mr-2" />
              Modify
            </Button>
          )}
          <AlertDialogAction
            onClick={onApprove}
            disabled={!hasReviewed}
            className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t.common.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for managing approval gates
export function useApprovalGate() {
  const [pendingAction, setPendingAction] = useState<ApprovalAction | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const requestApproval = (action: ApprovalAction): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingAction(action)
      setIsOpen(true)

      // Store resolve function for later
      ;(window as unknown as { __approvalResolve: (value: boolean) => void }).__approvalResolve = resolve
    })
  }

  const handleApprove = () => {
    setIsOpen(false)
    setPendingAction(null)
    const resolve = (window as unknown as { __approvalResolve?: (value: boolean) => void }).__approvalResolve
    if (resolve) resolve(true)
  }

  const handleReject = () => {
    setIsOpen(false)
    setPendingAction(null)
    const resolve = (window as unknown as { __approvalResolve?: (value: boolean) => void }).__approvalResolve
    if (resolve) resolve(false)
  }

  return {
    requestApproval,
    pendingAction,
    isOpen,
    handleApprove,
    handleReject,
  }
}
