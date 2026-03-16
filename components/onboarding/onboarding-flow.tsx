"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  MessageSquare, 
  Store, 
  BookOpen,
  Zap,
  Target,
  Palette,
  Code,
  FileText,
  CheckCircle2
} from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface OnboardingFlowProps {
  userId: string
  userEmail: string
  userName?: string
}

const interests = [
  { id: "content", label: "Content Creation", icon: FileText, description: "Documents, articles, presentations" },
  { id: "code", label: "Development", icon: Code, description: "Websites, apps, automation" },
  { id: "design", label: "Design", icon: Palette, description: "Visuals, branding, UI/UX" },
  { id: "business", label: "Business", icon: Target, description: "Strategy, analysis, planning" },
]

const features = [
  { id: "chat", label: "AI Chat", icon: MessageSquare, description: "Conversational AI assistant" },
  { id: "marketplace", label: "Marketplace", icon: Store, description: "Discover AI agents" },
  { id: "learn", label: "Nairi Learn", icon: BookOpen, description: "Personalized learning" },
  { id: "create", label: "Create", icon: Zap, description: "Generate anything" },
]

export function OnboardingFlow({ userId, userEmail, userName }: OnboardingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState(userName || "")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const totalSteps = 4
  const progress = ((step + 1) / totalSteps) * 100

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const completeOnboarding = async (destination: string) => {
    setIsLoading(true)
    const supabase = createClient()
    try {
      await supabase.from("profiles").update({
        full_name: displayName,
        onboarding_completed: true,
        interests: selectedInterests,
        updated_at: new Date().toISOString(),
      }).eq("id", userId)
      router.push(destination)
    } catch {
      console.error("Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => completeOnboarding("/dashboard")

  const nextStep = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step + 1} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="border-border bg-card/50 backdrop-blur">
          <CardContent className="p-8">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <Image
                    src="/images/nairi-logo-header.jpg"
                    alt="Nairi"
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome to <span className="gradient-text">Nairi</span>
                  </h1>
                  <p className="text-muted-foreground">
                    Let&apos;s set up your account and personalize your experience.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#e879f9]/10 to-transparent border border-border">
                    <Sparkles className="w-8 h-8 text-[#e879f9] mx-auto mb-2" />
                    <p className="text-sm font-medium">1,000 Credits</p>
                    <p className="text-xs text-muted-foreground">To start creating</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#22d3ee]/10 to-transparent border border-border">
                    <MessageSquare className="w-8 h-8 text-[#22d3ee] mx-auto mb-2" />
                    <p className="text-sm font-medium">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">Always available</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#e879f9]/10 to-transparent border border-border">
                    <Store className="w-8 h-8 text-[#e879f9] mx-auto mb-2" />
                    <p className="text-sm font-medium">Free Agents</p>
                    <p className="text-xs text-muted-foreground">Ready to use</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Profile Setup */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Set Up Your Profile</h2>
                  <p className="text-muted-foreground">How should we address you?</p>
                </div>
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={userEmail}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">This is your account email</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">What interests you?</h2>
                  <p className="text-muted-foreground">Select areas you&apos;d like to explore with Nairi</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {interests.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => handleInterestToggle(interest.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedInterests.includes(interest.id)
                          ? "border-[#e879f9] bg-[#e879f9]/10"
                          : "border-border bg-background/50 hover:border-[#e879f9]/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedInterests.includes(interest.id)
                            ? "bg-[#e879f9]/20"
                            : "bg-muted"
                        }`}>
                          <interest.icon className={`w-5 h-5 ${
                            selectedInterests.includes(interest.id) ? "text-[#e879f9]" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{interest.label}</p>
                          <p className="text-xs text-muted-foreground">{interest.description}</p>
                        </div>
                        <Checkbox checked={selectedInterests.includes(interest.id)} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Feature Tour + Choose first action */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">You&apos;re All Set!</h2>
                  <p className="text-muted-foreground">Here&apos;s what you can do with Nairi</p>
                </div>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div
                      key={feature.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background/50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center text-background font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <feature.icon className="w-4 h-4 text-[#e879f9]" />
                          <p className="font-medium text-foreground">{feature.label}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#22d3ee]" />
                    </div>
                  ))}
                </div>
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Your account is ready with <span className="text-[#e879f9] font-medium">1,000 free credits</span>
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-3">Choose your first action</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-1"
                      onClick={() => completeOnboarding("/builder")}
                      disabled={isLoading}
                    >
                      <Code className="w-6 h-6 mx-auto" />
                      <span>Builder</span>
                      <span className="text-xs font-normal text-muted-foreground">Build sites & apps</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-1"
                      onClick={() => completeOnboarding("/chat")}
                      disabled={isLoading}
                    >
                      <MessageSquare className="w-6 h-6 mx-auto" />
                      <span>Chat</span>
                      <span className="text-xs font-normal text-muted-foreground">AI assistant</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-1"
                      onClick={() => completeOnboarding("/workspace")}
                      disabled={isLoading}
                    >
                      <Zap className="w-6 h-6 mx-auto" />
                      <span>Workspace</span>
                      <span className="text-xs font-normal text-muted-foreground">Create & manage</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              {step < totalSteps - 1 ? (
                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90 gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90 gap-2"
                >
                  {isLoading ? "Setting up..." : "Go to Dashboard"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip Option */}
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={handleComplete}
            className="text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
