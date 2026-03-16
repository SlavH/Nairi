'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Beaker, Loader2, Download, Play } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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

export default function SimulationsPage() {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<string>('physics')
  const [complexity, setComplexity] = useState<string>('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [simulationHtml, setSimulationHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your simulation')
      return
    }
    setIsGenerating(true)
    setError(null)
    setSimulationHtml(null)
    try {
      const res = await fetch('/api/generate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: type as 'physics' | 'chemistry' | 'biology' | 'math' | 'custom',
          complexity: complexity as 'simple' | 'medium' | 'complex',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed')
        toast.error(data.error || 'Generation failed')
        return
      }
      if (data.simulationHtml) {
        setSimulationHtml(data.simulationHtml)
        toast.success('Simulation generated!')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate simulation'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadHtml = () => {
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
    <div className="h-full w-full p-4 sm:p-6 md:p-8 overflow-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-primary/10">
            <Beaker className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Interactive Simulations</h1>
            <p className="text-muted-foreground">Physics, Chemistry, Biology & Math — create and run simulations</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a simulation</CardTitle>
            <CardDescription>Describe what you want to simulate; we generate an interactive HTML5 Canvas simulation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sim-prompt">What should the simulation show?</Label>
              <Textarea
                id="sim-prompt"
                placeholder="e.g. A pendulum with adjustable length and gravity, or projectile motion with initial velocity"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIM_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select value={complexity} onValueChange={setComplexity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPLEXITY.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating…</> : <><Play className="h-4 w-4 mr-2" /> Generate simulation</>}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              You can also create simulations from <Link href="/workspace/create" className="underline">Workspace → Create</Link> or by asking in <Link href="/chat" className="underline">Chat</Link>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Preview</CardTitle>
            {simulationHtml && (
              <Button variant="outline" size="sm" onClick={downloadHtml}>
                <Download className="h-4 w-4 mr-1" /> Download HTML
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {simulationHtml ? (
              <div className="rounded-lg border bg-muted/30 overflow-hidden" style={{ minHeight: 320 }}>
                <iframe
                  srcDoc={simulationHtml}
                  title="Simulation preview"
                  className="w-full h-[360px] border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/20 flex items-center justify-center min-h-[320px] text-muted-foreground">
                Generate a simulation to see the preview here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        {SIM_TYPES.map((t) => (
          <div key={t.id} className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-medium">{t.name}</h3>
            <p className="text-sm text-muted-foreground">
              {t.id === 'physics' && 'Pendulums, projectiles, waves'}
              {t.id === 'chemistry' && 'Molecular structures, reactions'}
              {t.id === 'biology' && 'Population dynamics, ecosystems'}
              {t.id === 'math' && 'Fractals, graphs, geometry'}
              {t.id === 'custom' && 'Any interactive visualization'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
