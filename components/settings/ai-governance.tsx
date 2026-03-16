"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Brain,
  Sparkles,
  Shield,
  Eye,
  MessageSquare,
  GraduationCap,
  Palette,
  Scale,
  Save,
  RotateCcw,
  Info,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Types for AI Governance settings
interface BehaviorSliders {
  strictness: number // 0-100
  creativity: number // 0-100
  assertiveness: number // 0-100
  verbosity: number // 0-100
  questionFrequency: number // 0-100
}

interface ContextSettings {
  chat: BehaviorSliders
  education: BehaviorSliders
  creation: BehaviorSliders
  research: BehaviorSliders
}

interface MemoryPermissions {
  rememberConversations: boolean
  rememberPreferences: boolean
  rememberLearningProgress: boolean
  rememberPersonalInfo: boolean
  retentionPeriod: "session" | "week" | "month" | "year" | "forever"
  allowedContexts: string[]
}

interface AIGovernanceSettings {
  behaviors: ContextSettings
  memory: MemoryPermissions
  safety: {
    requireApprovalForActions: boolean
    showConfidenceScores: boolean
    enableAntiEchoChamber: boolean
    enableFatigueDetection: boolean
    enablePurposeChecks: boolean
  }
}

const defaultBehaviors: BehaviorSliders = {
  strictness: 50,
  creativity: 50,
  assertiveness: 50,
  verbosity: 50,
  questionFrequency: 50,
}

const defaultSettings: AIGovernanceSettings = {
  behaviors: {
    chat: { ...defaultBehaviors },
    education: { ...defaultBehaviors, strictness: 70, questionFrequency: 80 },
    creation: { ...defaultBehaviors, creativity: 80, assertiveness: 30 },
    research: { ...defaultBehaviors, strictness: 80, verbosity: 70 },
  },
  memory: {
    rememberConversations: true,
    rememberPreferences: true,
    rememberLearningProgress: true,
    rememberPersonalInfo: false,
    retentionPeriod: "month",
    allowedContexts: ["chat", "education", "creation"],
  },
  safety: {
    requireApprovalForActions: true,
    showConfidenceScores: true,
    enableAntiEchoChamber: true,
    enableFatigueDetection: true,
    enablePurposeChecks: false,
  },
}

interface AIGovernanceProps {
  userId: string
  initialSettings?: AIGovernanceSettings
  onSave?: (settings: AIGovernanceSettings) => Promise<void>
}

export function AIGovernance({ userId, initialSettings, onSave }: AIGovernanceProps) {
  const t = useTranslation()
  const [settings, setSettings] = useState<AIGovernanceSettings>(initialSettings || defaultSettings)
  const [activeContext, setActiveContext] = useState<keyof ContextSettings>("chat")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(initialSettings || defaultSettings))
  }, [settings, initialSettings])

  const handleBehaviorChange = (key: keyof BehaviorSliders, value: number[]) => {
    setSettings((prev) => ({
      ...prev,
      behaviors: {
        ...prev.behaviors,
        [activeContext]: {
          ...prev.behaviors[activeContext],
          [key]: value[0],
        },
      },
    }))
  }

  const handleMemoryChange = (key: keyof MemoryPermissions, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      memory: {
        ...prev.memory,
        [key]: value,
      },
    }))
  }

  const handleSafetyChange = (key: keyof AIGovernanceSettings["safety"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      safety: {
        ...prev.safety,
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      
      // Upsert AI settings
      const { error } = await supabase
        .from("user_ai_settings")
        .upsert({
          user_id: userId,
          settings: settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        })
      
      if (error) {
        console.error("Error saving AI settings:", error)
        toast.error("Failed to save settings")
        return
      }
      
      await onSave?.(settings)
      setHasChanges(false)
      toast.success("AI governance settings saved")
    } catch (e) {
      console.error("Error saving AI settings:", e)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(initialSettings || defaultSettings)
  }

  const contextIcons = {
    chat: MessageSquare,
    education: GraduationCap,
    creation: Palette,
    research: Scale,
  }

  const contextLabels = {
    chat: t.nav.chat,
    education: t.nav.learn,
    creation: "Creation",
    research: "Research",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            {t.settings.aiGovernance}
          </h2>
          <p className="text-muted-foreground mt-1">Control how Nairi behaves and what it remembers</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges} className="bg-transparent">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="behavior">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="behavior" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t.settings.behaviorSliders}
          </TabsTrigger>
          <TabsTrigger value="memory" className="gap-2">
            <Brain className="h-4 w-4" />
            {t.settings.memoryPermissions}
          </TabsTrigger>
          <TabsTrigger value="safety" className="gap-2">
            <Shield className="h-4 w-4" />
            Safety
          </TabsTrigger>
        </TabsList>

        {/* Behavior Controls */}
        <TabsContent value="behavior" className="space-y-6 mt-6">
          {/* Context Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Context-Specific Behavior</CardTitle>
              <CardDescription>
                Customize AI behavior for different contexts. Each context can have its own settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {(Object.keys(settings.behaviors) as Array<keyof ContextSettings>).map((context) => {
                  const Icon = contextIcons[context]
                  return (
                    <Button
                      key={context}
                      variant={activeContext === context ? "default" : "outline"}
                      onClick={() => setActiveContext(context)}
                      className={cn(
                        "gap-2",
                        activeContext === context ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8]" : "bg-transparent",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {contextLabels[context]}
                    </Button>
                  )
                })}
              </div>

              {/* Sliders */}
              <div className="space-y-6">
                <BehaviorSlider
                  label={t.settings.strictness}
                  description="How strictly should Nairi follow instructions and guidelines?"
                  value={settings.behaviors[activeContext].strictness}
                  onChange={(v) => handleBehaviorChange("strictness", v)}
                  lowLabel="Flexible"
                  highLabel="Strict"
                />

                <BehaviorSlider
                  label={t.settings.creativity}
                  description="How creative and unconventional should responses be?"
                  value={settings.behaviors[activeContext].creativity}
                  onChange={(v) => handleBehaviorChange("creativity", v)}
                  lowLabel="Conservative"
                  highLabel="Creative"
                />

                <BehaviorSlider
                  label={t.settings.assertiveness}
                  description="How confidently should Nairi express opinions?"
                  value={settings.behaviors[activeContext].assertiveness}
                  onChange={(v) => handleBehaviorChange("assertiveness", v)}
                  lowLabel="Tentative"
                  highLabel="Assertive"
                />

                <BehaviorSlider
                  label="Verbosity"
                  description="How detailed should responses be?"
                  value={settings.behaviors[activeContext].verbosity}
                  onChange={(v) => handleBehaviorChange("verbosity", v)}
                  lowLabel="Concise"
                  highLabel="Detailed"
                />

                <BehaviorSlider
                  label="Question Frequency"
                  description="How often should Nairi ask clarifying questions?"
                  value={settings.behaviors[activeContext].questionFrequency}
                  onChange={(v) => handleBehaviorChange("questionFrequency", v)}
                  lowLabel="Rarely"
                  highLabel="Often"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Permissions */}
        <TabsContent value="memory" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.settings.whatToRemember}</CardTitle>
              <CardDescription>Control what information Nairi can store and use</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MemoryToggle
                label="Remember Conversations"
                description="Allow Nairi to reference previous conversations"
                checked={settings.memory.rememberConversations}
                onChange={(v) => handleMemoryChange("rememberConversations", v)}
              />

              <MemoryToggle
                label="Remember Preferences"
                description="Remember your style and communication preferences"
                checked={settings.memory.rememberPreferences}
                onChange={(v) => handleMemoryChange("rememberPreferences", v)}
              />

              <MemoryToggle
                label="Remember Learning Progress"
                description="Track your learning journey and skill development"
                checked={settings.memory.rememberLearningProgress}
                onChange={(v) => handleMemoryChange("rememberLearningProgress", v)}
              />

              <MemoryToggle
                label="Remember Personal Information"
                description="Store personal details you share (name, interests, etc.)"
                checked={settings.memory.rememberPersonalInfo}
                onChange={(v) => handleMemoryChange("rememberPersonalInfo", v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.settings.howLong}</CardTitle>
              <CardDescription>How long should Nairi retain your data?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.settings.dataRetention}</Label>
                  <Select
                    value={settings.memory.retentionPeriod}
                    onValueChange={(v) => handleMemoryChange("retentionPeriod", v)}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">This session only</SelectItem>
                      <SelectItem value="week">1 week</SelectItem>
                      <SelectItem value="month">1 month</SelectItem>
                      <SelectItem value="year">1 year</SelectItem>
                      <SelectItem value="forever">Forever (until deleted)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="bg-transparent">
                    <Eye className="h-4 w-4 mr-2" />
                    {t.settings.exportData}
                  </Button>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10 bg-transparent">
                    {t.settings.deleteData}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Settings */}
        <TabsContent value="safety" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Safety & Trust Features</CardTitle>
              <CardDescription>Configure how Nairi handles sensitive actions and transparency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MemoryToggle
                label="Require Approval for Actions"
                description="Ask for confirmation before executing irreversible actions"
                checked={settings.safety.requireApprovalForActions}
                onChange={(v) => handleSafetyChange("requireApprovalForActions", v)}
              />

              <MemoryToggle
                label="Show Confidence Scores"
                description="Display AI confidence level for each response"
                checked={settings.safety.showConfidenceScores}
                onChange={(v) => handleSafetyChange("showConfidenceScores", v)}
              />

              <MemoryToggle
                label="Enable Anti-Echo-Chamber"
                description="Actively present opposing viewpoints to prevent ideological locking"
                checked={settings.safety.enableAntiEchoChamber}
                onChange={(v) => handleSafetyChange("enableAntiEchoChamber", v)}
              />

              <MemoryToggle
                label="Enable Fatigue Detection"
                description="Monitor for cognitive overload and suggest breaks"
                checked={settings.safety.enableFatigueDetection}
                onChange={(v) => handleSafetyChange("enableFatigueDetection", v)}
              />

              <MemoryToggle
                label="Enable Purpose Checks"
                description="Periodically ask about your goals to prevent meaningless engagement"
                checked={settings.safety.enablePurposeChecks}
                onChange={(v) => handleSafetyChange("enablePurposeChecks", v)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Reusable Behavior Slider Component
function BehaviorSlider({
  label,
  description,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string
  description: string
  value: number
  onChange: (value: number[]) => void
  lowLabel: string
  highLabel: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="font-medium">{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge variant="outline" className="font-mono">
          {value}%
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-20">{lowLabel}</span>
        <Slider value={[value]} onValueChange={onChange} max={100} step={5} className="flex-1" />
        <span className="text-xs text-muted-foreground w-20 text-right">{highLabel}</span>
      </div>
    </div>
  )
}

// Reusable Memory Toggle Component
function MemoryToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
      <div className="space-y-0.5">
        <Label className="font-medium cursor-pointer">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
