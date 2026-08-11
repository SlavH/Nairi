"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Concept, DependencyEdge, CycleBreak } from "@/lib/nairibook/types"
import type { SM2State } from "@/lib/nairibook/srs"

interface Props {
  concepts: Concept[]
  edges: DependencyEdge[]
  topologicalOrder: string[]
  cycleBreaks: CycleBreak[]
  srStates?: Map<string, SM2State>
}

type Maturity = "never" | "learning" | "due" | "mastered"

function maturity(state: SM2State | undefined, now: number): Maturity {
  if (!state) return "never"
  if (state.next_review_date <= now) return "due"
  if (state.repetitions >= 3) return "mastered"
  return "learning"
}

const MATURITY_COLORS: Record<Maturity, string> = {
  never: "#666",
  learning: "#fbbf24",
  due: "#ef4444",
  mastered: "#22c55e",
}

const MATURITY_LABELS: Record<Maturity, string> = {
  never: "Never studied",
  learning: "Learning",
  due: "Due for review",
  mastered: "Mastered",
}

// Lightweight SVG concept graph. Layout: nodes placed in a vertical flow ordered
// by topological sort, x-position jittered by chapter so dependencies read
// top-to-bottom. No external graph library needed.
export function ConceptGraphView({ concepts, edges, topologicalOrder, cycleBreaks, srStates }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const now = useMemo(() => Date.now(), [])

  const byId = useMemo(() => new Map(concepts.map((c) => [c.concept_id, c])), [concepts])

  const layout = useMemo(() => {
    const order = topologicalOrder.length ? topologicalOrder : concepts.map((c) => c.concept_id)
    const pos = new Map<string, { x: number; y: number }>()
    const COLS = Math.max(2, Math.ceil(Math.sqrt(order.length)))
    const W = 900
    const H = 60 + order.length * 46
    order.forEach((id, i) => {
      const c = byId.get(id)
      const col = c ? c.chapter % COLS : i % COLS
      const row = Math.floor(i / COLS)
      pos.set(id, {
        x: 80 + (col * (W - 160)) / Math.max(1, COLS - 1),
        y: 50 + row * 46,
      })
    })
    return { pos, W, H }
  }, [topologicalOrder, concepts, byId])

  const selectedConcept = selected ? byId.get(selected) : null
  const depNames = selected
    ? edges.find((e) => e.concept_id === selected)?.depends_on.map((d) => byId.get(d)?.title).filter(Boolean) ?? []
    : []

  if (concepts.length === 0) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No concepts to display. Process a PDF to generate a concept map.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Concept dependency graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[520px] border border-border rounded-lg bg-background">
            <svg viewBox={`0 0 ${layout.W} ${layout.H}`} className="w-full min-w-full">
              {edges.map((e, i) => {
                const a = layout.pos.get(e.concept_id)
                const deps = e.depends_on
                return deps.map((d, j) => {
                  const b = layout.pos.get(d)
                  if (!a || !b) return null
                  const active = selected === e.concept_id || selected === d
                  return (
                    <line
                      key={`${i}-${j}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={active ? "#22d3ee" : "#555"}
                      strokeWidth={active ? 2 : 1}
                    />
                  )
                })
              })}
              {concepts.map((c) => {
                const p = layout.pos.get(c.concept_id)
                if (!p) return null
                const active = selected === c.concept_id
                const st = srStates?.get(c.concept_id)
                const m = maturity(st, now)
                const fill = m === "learning"
                  ? `hsl(${(c.chapter * 47) % 360} 70% 55%)`
                  : active ? "#22d3ee" : MATURITY_COLORS[m]
                return (
                  <g
                    key={c.concept_id}
                    transform={`translate(${p.x},${p.y})`}
                    className="cursor-pointer"
                    onClick={() => setSelected(c.concept_id)}
                  >
                    <circle r={11} fill="none" stroke={active ? "#22d3ee" : MATURITY_COLORS[m]} strokeWidth={m === "never" ? 1 : 2} opacity={m === "never" ? 0.5 : 1} />
                    <circle r={9} fill={fill} />
                    <text x={14} y={4} fill="#e5e5e5" fontSize={11} className="select-none">
                      {c.title.length > 40 ? c.title.slice(0, 40) + "…" : c.title}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          {cycleBreaks.length > 0 && (
            <p className="text-[10px] text-yellow-500 mt-2">
              {cycleBreaks.length} cycle(s) auto-broken to keep the graph acyclic (logged for quality review).
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-sm">
            {selectedConcept ? "Concept details" : "Recommended study order"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedConcept ? (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">{selectedConcept.title}</h4>
              <p className="text-xs text-muted-foreground">{selectedConcept.description}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="bg-muted/50 text-xs">Chapter {selectedConcept.chapter + 1}</Badge>
                {depNames.length > 0 && (
                  <Badge variant="secondary" className="bg-muted/50 text-xs">Prereq: {depNames.length}</Badge>
                )}
              </div>
              {(() => {
                const st = srStates?.get(selectedConcept.concept_id)
                const m = maturity(st, now)
                return (
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-foreground">Mastery</p>
                    <p className="text-muted-foreground" style={{ color: MATURITY_COLORS[m] }}>
                      {MATURITY_LABELS[m]}
                    </p>
                    {st && (
                      <div className="text-muted-foreground space-y-0.5 mt-1">
                        <p>Repetitions: {st.repetitions}</p>
                        <p>Ease factor: {st.ease_factor.toFixed(2)}</p>
                        <p>Interval: {st.interval}d</p>
                        <p>Next review: {new Date(st.next_review_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )
              })()}
              {depNames.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Depends on:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {depNames.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {srStates && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">📊 Book Progress Summary</h4>
                  <div className="space-y-2">
                    {(() => {
                      const stats = {
                        never: Array.from(srStates.values()).filter(st => !st).length,
                        learning: Array.from(srStates.values()).filter(st => maturity(st, now) === "learning").length,
                        due: Array.from(srStates.values()).filter(st => maturity(st, now) === "due").length,
                        mastered: Array.from(srStates.values()).filter(st => maturity(st, now) === "mastered").length,
                      }
                      const total = Object.values(stats).reduce((a, b) => a + b, 0)
                      
                      return (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span>Total concepts:</span>
                            <span className="font-medium text-foreground">{total}</span>
                          </div>
                          
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Mastered
                              </div>
                              <span className="font-medium">{stats.mastered}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div 
                                className="bg-[#22c55e] h-1.5 rounded-full" 
                                style={{ width: `${(stats.mastered / Math.max(total, 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#ef4444]" /> Due
                              </div>
                              <span className="font-medium">{stats.due}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div 
                                className="bg-[#ef4444] h-1.5 rounded-full" 
                                style={{ width: `${(stats.due / Math.max(total, 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Learning
                              </div>
                              <span className="font-medium">{stats.learning}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div 
                                className="bg-[#fbbf24] h-1.5 rounded-full" 
                                style={{ width: `${(stats.learning / Math.max(total, 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#666]" /> Never studied
                              </div>
                              <span className="font-medium">{stats.never}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div 
                                className="bg-[#666] h-1.5 rounded-full" 
                                style={{ width: `${(stats.never / Math.max(total, 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="pt-2 mt-2 border-t border-border">
                            <div className="text-muted-foreground text-xs">
                              Mastered: {Math.round((stats.mastered / Math.max(total, 1)) * 100)}% | 
                              In progress: {Math.round(((stats.learning + stats.due) / Math.max(total, 1)) * 100)}%
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">📚 Recommended study order</h4>
                <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  {topologicalOrder.map((id) => {
                    const st = srStates?.get(id)
                    const m = maturity(st, now)
                    return (
                      <li key={id} className="cursor-pointer hover:text-foreground" onClick={() => setSelected(id)} style={{ color: m === "never" ? undefined : MATURITY_COLORS[m] }}>
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: m === "never" ? "#888" : MATURITY_COLORS[m] }} />
                        {byId.get(id)?.title ?? id}
                        {m !== "never" && (
                          <span className="text-muted-foreground ml-2">({m})</span>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
