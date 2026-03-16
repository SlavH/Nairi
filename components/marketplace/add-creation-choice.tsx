"use client"

import { useState } from "react"
import { CreateAgentForm } from "@/components/marketplace/create-agent-form"
import { CreateCreationForm } from "@/components/marketplace/create-creation-form"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type Choice = "agent" | "creation" | null

interface AddCreationChoiceProps {
  userId: string
}

export function AddCreationChoice({ userId }: AddCreationChoiceProps) {
  const [choice, setChoice] = useState<Choice>(null)

  if (choice === "agent") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Sell an AI agent that users can chat with.</p>
        <CreateAgentForm userId={userId} />
      </div>
    )
  }

  if (choice === "creation") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Sell any creation: text, websites, templates, tools, and more.</p>
        <CreateCreationForm />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Choose what you want to add and sell.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className={cn(
            "cursor-pointer transition-all bg-white/5 border-white/20 hover:border-[#00c9c8]/50 hover:bg-white/10"
          )}
          onClick={() => setChoice("agent")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center shrink-0">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Agent</h3>
              <p className="text-sm text-muted-foreground">Chatbot or assistant others can use in Nairi.</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-all bg-white/5 border-white/20 hover:border-[#00c9c8]/50 hover:bg-white/10"
          )}
          onClick={() => setChoice("creation")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-[#00c9c8]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Text, website, template…</h3>
              <p className="text-sm text-muted-foreground">Any creation: documents, code, designs, courses.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
