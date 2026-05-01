'use client'

import { useState, useRef } from 'react'
import { Beaker, Globe, Loader2, Download, Play, Sparkles, Zap, Monitor, Box, TreePine, Mountain, Droplets, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Link from 'next/link'
import { WorldViewer } from '@/components/simulations/world-viewer'

const SIM_TYPES = [
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
  { id: 'math', name: 'Mathematics' },
  { id: 'custom', name: 'Custom' },
] as const

const COMPLEXITY = [
  { id: 'simple', name: 'Simple' },
  { id: 'medium', name: 'Medium' },
  { id: 'complex', name: 'Complex' },
] as const

const WORLD_MODES = [
  { id: 'world', name: 'Full World', description: 'Explorable 3D environment' },
  { id: 'scene', name: 'Scene', description: 'Detailed interactive scene' },
  { id: 'environment', name: 'Environment', description: 'Atmospheric environment' },
] as const

const WORLD_STYLES = [
  { id: 'realistic', name: 'Realistic' },
  { id: 'stylized', name: 'Stylized' },
  { id: 'low-poly', name: 'Low Poly' },
  { id: 'pixel', name: 'Pixel' },
  { id: 'cinematic', name: 'Cinematic' },
] as const

const WORLD_PROMPTS = [
  'A mystical forest with ancient trees, glowing mushrooms, and a crystal-clear stream running through it',
  'A futuristic cyberpunk city at night with neon signs, flying cars, and towering skyscrapers',
  'A serene Japanese garden with cherry blossoms, a koi pond, and a traditional wooden bridge',
  'A volcanic landscape with flowing lava, obsidian rocks, and ash particles in the air',
  'An underwater coral reef teeming with colorful fish, sea anemones, and sunlight filtering through water',
  'A medieval castle courtyard with stone walls, a fountain, torches, and a drawbridge',
]

interface WorldSpec {
  name: string
  description: string
  skybox: Record<string, unknown>
  lighting: Record<string, unknown>
  terrain: Record<string, unknown>
  objects: Array<Record<string, unknown>>
  atmosphere: Record<string, unknown>
  water: Record<string, unknown>
  camera: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export default function SimulationsPage() {
  const [simPrompt, setSimPrompt] = useState('')
  const [simType, setSimType] = useState<string>('physics')
  const [simComplexity, setSimComplexity] = useState<string>('medium')
  const [isSimGenerating, setIsSimGenerating] = useState(false)
  const [simulationHtml, setSimulationHtml] = useState<string | null>(null)
  const [simError, setSimError] = useState<string | null>(null)

  const [worldPrompt, setWorldPrompt] = useState('')
  const [worldMode, setWorldMode] = useState<string>('world')
  const [worldStyle, setWorldStyle] = useState<string>('realistic')
  const [isWorldGenerating, setIsWorldGenerating] = useState(false)
  const [worldSpec, setWorldSpec] = useState<WorldSpec | null>(null)
  const [worldError, setWorldError] = useState<string | null>(null)
  const [isExploring, setIsExploring] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSimGenerate = async () => {
    if (!simPrompt.trim()) {
      toast.error('Please enter a description for your simulation')
      return
    }
    setIsSimGenerating(true)
    setSimError(null)
    setSimulationHtml(null)
    try {
      const res = await fetch('/api/generate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: simPrompt.trim(),
          type: simType as 'physics' | 'chemistry' | 'biology' | 'math' | 'custom',
          complexity: simComplexity as 'simple' | 'medium' | 'complex',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSimError(data.error || 'Generation failed')
        toast.error(data.error || 'Generation failed')
        return
      }
      if (data.simulationHtml) {
        setSimulationHtml(data.simulationHtml)
        toast.success('Simulation generated!')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate simulation'
      setSimError(msg)
      toast.error(msg)
    } finally {
      setIsSimGenerating(false)
    }
  }

  const handleWorldGenerate = async () => {
    if (!worldPrompt.trim()) {
      toast.error('Please describe the world you want to create')
      return
    }
    setIsWorldGenerating(true)
    setWorldError(null)
    setWorldSpec(null)
    setIsExploring(false)
    try {
      const res = await fetch('/api/generate-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: worldPrompt.trim(),
          mode: worldMode as 'world' | 'scene' | 'environment',
          style: worldStyle as 'realistic' | 'stylized' | 'low-poly' | 'pixel' | 'cinematic',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setWorldError(data.error || 'World generation failed')
        toast.error(data.error || 'World generation failed')
        return
      }
      if (data.world) {
        setWorldSpec(data.world)
        toast.success('World generated! Click Explore to enter.')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate world'
      setWorldError(msg)
      toast.error(msg)
    } finally {
      setIsWorldGenerating(false)
    }
  }

  const downloadSimHtml = () => {
    if (!simulationHtml) return
    const blob = new Blob([simulationHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nairi-simulation-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded as HTML')
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <Globe className="h-7 w-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                AI Simulations & Worlds
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Powered by AMD Micro-World — Genie 3-style world generation on AMD GPUs
            </p>
          </div>
          <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
            <Zap className="h-3 w-3 mr-1" />
            AMD GPU
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-6 pt-4">
        <Tabs defaultValue="worlds" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="worlds" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Globe className="h-4 w-4 mr-1.5" />
              AI Worlds
            </TabsTrigger>
            <TabsTrigger value="classic" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
              <Beaker className="h-4 w-4 mr-1.5" />
              Classic Simulations
            </TabsTrigger>
          </TabsList>

          {/* AI Worlds Tab */}
          <TabsContent value="worlds" className="mt-4 flex-1 min-h-0 flex flex-col">
            {!isExploring && worldSpec ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 min-h-0">
                  <WorldViewer
                    world={worldSpec}
                    onExit={() => {
                      setIsExploring(false)
                      setWorldSpec(null)
                    }}
                  />
                </div>
                <div className="shrink-0 px-4 py-3 flex items-center gap-3 border-t border-white/10 bg-white/5">
                  <Button onClick={() => { setIsExploring(false); setWorldSpec(null) }} variant="outline" size="sm">
                    ← Back to Generator
                  </Button>
                  <Button onClick={() => setIsExploring(true)} size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                    <Play className="h-4 w-4 mr-1.5" /> Explore World
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 grid lg:grid-cols-2 gap-4 overflow-hidden">
                {/* Left: Generator */}
                <div className="flex flex-col overflow-y-auto pr-2">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">Generate a 3D World</h2>
                      <p className="text-sm text-muted-foreground">
                        Describe any environment and AI will create an explorable 3D world.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="world-prompt">World Description</Label>
                      <Textarea
                        id="world-prompt"
                        ref={textareaRef}
                        placeholder="A mystical forest with glowing mushrooms and a crystal stream..."
                        value={worldPrompt}
                        onChange={(e) => setWorldPrompt(e.target.value)}
                        className="min-h-[100px] bg-white/5 border-white/10 focus:ring-purple-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Mode</Label>
                        <Select value={worldMode} onValueChange={setWorldMode}>
                          <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WORLD_MODES.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select value={worldStyle} onValueChange={setWorldStyle}>
                          <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WORLD_STYLES.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleWorldGenerate}
                      disabled={isWorldGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                    >
                      {isWorldGenerating ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating World…</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Generate World</>
                      )}
                    </Button>

                    {worldError && <p className="text-sm text-destructive">{worldError}</p>}

                    {/* Quick Prompts */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try a prompt:</p>
                      <div className="space-y-1.5">
                        {WORLD_PROMPTS.slice(0, 4).map((p, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setWorldPrompt(p)
                              textareaRef.current?.focus()
                            }}
                            className="w-full text-left text-xs p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all text-muted-foreground hover:text-foreground"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Preview / Placeholder */}
                <div className="flex flex-col overflow-hidden">
                  {worldSpec ? (
                    <div className="flex-1 min-h-0">
                      <WorldViewer world={worldSpec} onEnter={() => setIsExploring(true)} />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-white/5 rounded-xl border border-white/10">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 shadow-lg shadow-purple-500/20">
                        <Globe className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        AI World Generator
                      </h3>
                      <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                        Describe any environment. AMD GPU generates an interactive 3D world you can explore with WASD controls.
                      </p>
                      <div className="grid grid-cols-2 gap-3 max-w-xs">
                        {[
                          { icon: <Mountain className="h-5 w-5" />, label: 'Terrain' },
                          { icon: <TreePine className="h-5 w-5" />, label: 'Vegetation' },
                          { icon: <Droplets className="h-5 w-5" />, label: 'Water' },
                          { icon: <Wind className="h-5 w-5" />, label: 'Atmosphere' },
                        ].map((f) => (
                          <div key={f.label} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                            <div className="text-purple-400 flex justify-center mb-1">{f.icon}</div>
                            <p className="text-xs font-medium">{f.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Classic Simulations Tab */}
          <TabsContent value="classic" className="mt-4 flex-1 min-h-0">
            <div className="flex-1 min-h-0 grid lg:grid-cols-2 gap-4 overflow-hidden">
              <div className="flex flex-col overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Create a Simulation</h2>
                    <p className="text-sm text-muted-foreground">
                      Physics, Chemistry, Biology & Math — interactive HTML5 Canvas simulations.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sim-prompt">What should the simulation show?</Label>
                    <Textarea
                      id="sim-prompt"
                      placeholder="e.g. A pendulum with adjustable length and gravity"
                      value={simPrompt}
                      onChange={(e) => setSimPrompt(e.target.value)}
                      className="min-h-[100px] bg-white/5 border-white/10 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={simType} onValueChange={setSimType}>
                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SIM_TYPES.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Complexity</Label>
                      <Select value={simComplexity} onValueChange={setSimComplexity}>
                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COMPLEXITY.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSimGenerate}
                    disabled={isSimGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90"
                  >
                    {isSimGenerating ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating…</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" /> Generate Simulation</>
                    )}
                  </Button>

                  {simError && <p className="text-sm text-destructive">{simError}</p>}

                  <p className="text-xs text-muted-foreground">
                    Also create simulations from <Link href="/workspace/create" className="underline">Workspace → Create</Link> or by asking in <Link href="/chat" className="underline">Chat</Link>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col overflow-hidden">
                {simulationHtml ? (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 rounded-xl border bg-white/5 overflow-hidden">
                      <iframe
                        srcDoc={simulationHtml}
                        title="Simulation preview"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                    <div className="shrink-0 px-4 py-3 border-t border-white/10 flex justify-end">
                      <Button variant="outline" size="sm" onClick={downloadSimHtml}>
                        <Download className="h-4 w-4 mr-1.5" /> Download HTML
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <Beaker className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Generate a simulation to see the preview here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Feature Cards */}
      <div className="shrink-0 px-6 pb-4 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <Globe className="h-5 w-5" />,
              title: '3D Worlds',
              desc: 'Genie 3-style world generation',
              color: 'from-purple-500/20 to-pink-500/20',
              border: 'border-purple-500/30',
            },
            {
              icon: <Monitor className="h-5 w-5" />,
              title: 'Interactive',
              desc: 'WASD movement + mouse look',
              color: 'from-cyan-500/20 to-blue-500/20',
              border: 'border-cyan-500/30',
            },
            {
              icon: <Box className="h-5 w-5" />,
              title: 'Procedural',
              desc: 'Terrain, objects, atmosphere',
              color: 'from-pink-500/20 to-rose-500/20',
              border: 'border-pink-500/30',
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: 'AMD GPU',
              desc: 'Powered by AMD Micro-World',
              color: 'from-amber-500/20 to-orange-500/20',
              border: 'border-amber-500/30',
            },
          ].map((f) => (
            <div key={f.title} className={`p-4 rounded-xl bg-gradient-to-br ${f.color} border ${f.border}`}>
              <div className="text-purple-400 mb-2">{f.icon}</div>
              <h3 className="font-medium text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
