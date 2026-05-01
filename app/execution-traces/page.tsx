'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Terminal, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Filter, Search, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type TraceStatus = 'success' | 'error' | 'warning' | 'running'

interface TraceStep {
  id: string
  name: string
  status: TraceStatus
  duration: string
  details?: string
}

interface ExecutionTrace {
  id: string
  name: string
  type: string
  status: TraceStatus
  startTime: string
  duration: string
  steps: TraceStep[]
  input?: string
  output?: string
}

export default function ExecutionTracesPage() {
  const router = useRouter()
  const [traces, setTraces] = useState<ExecutionTrace[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | TraceStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTraces = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    let tracesData: any[] = []
    try {
      const { data } = await supabase
        .from('execution_traces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      tracesData = data || []
    } catch {
      // Table might not exist yet
    }

    const formatted: ExecutionTrace[] = tracesData.map((t: any) => ({
      id: t.id,
      name: t.name || `${t.type} execution`,
      type: t.type || 'unknown',
      status: t.status || 'success',
      startTime: new Date(t.created_at).toLocaleString(),
      duration: t.duration_ms ? `${(t.duration_ms / 1000).toFixed(1)}s` : 'N/A',
      steps: t.steps || [],
      input: t.input,
      output: t.output,
    }))

    setTraces(formatted)
    setLoading(false)
  }

  useEffect(() => {
    fetchTraces()
  }, [])

  const toggleTrace = (id: string) => {
    const newExpanded = new Set(expandedTraces)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedTraces(newExpanded)
  }

  const filteredTraces = traces.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getStatusIcon = (status: TraceStatus) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'running': return <Clock className="w-5 h-5 text-blue-400 animate-spin" />
    }
  }

  const getStatusColor = (status: TraceStatus) => {
    switch (status) {
      case 'success': return 'border-green-500/50 bg-green-500/10'
      case 'error': return 'border-red-500/50 bg-red-500/10'
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10'
      case 'running': return 'border-blue-500/50 bg-blue-500/10'
    }
  }

  const stats = {
    total: traces.length,
    success: traces.filter(t => t.status === 'success').length,
    errors: traces.filter(t => t.status === 'error').length,
    warnings: traces.filter(t => t.status === 'warning').length
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Execution Traces</h1>
            </div>
          </div>
          <button onClick={fetchTraces} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]" aria-label="Refresh traces">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-white/60 text-sm mb-1">Total Executions</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
            <div className="text-green-400 text-sm mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-400">{stats.success}</div>
          </div>
          <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
            <div className="text-yellow-400 text-sm mb-1">Warnings</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.warnings}</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
            <div className="text-red-400 text-sm mb-1">Errors</div>
            <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search executions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Status:</span>
          </div>
          <div className="flex gap-2">
            {['all', 'success', 'warning', 'error'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === f
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Traces List */}
        <div className="space-y-4">
          {filteredTraces.length === 0 ? (
            <div className="text-center py-12">
              <Terminal className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No execution traces</h3>
              <p className="text-white/60">Traces will appear here when you use AI features</p>
            </div>
          ) : (
            filteredTraces.map((trace) => (
              <div
                key={trace.id}
                className={`rounded-xl border ${getStatusColor(trace.status)} overflow-hidden`}
              >
                {/* Header */}
                <button
                  onClick={() => toggleTrace(trace.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                >
                  {expandedTraces.has(trace.id) ? (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white/60" />
                  )}
                  {getStatusIcon(trace.status)}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{trace.name}</h3>
                    <p className="text-sm text-white/60">{trace.type} • {trace.startTime}</p>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{trace.duration}</span>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedTraces.has(trace.id) && (
                  <div className="border-t border-white/10 p-4 bg-black/30">
                    {/* Input/Output */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-white/40 mb-1">Input</div>
                        <div className="text-sm font-mono">{trace.input}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-white/40 mb-1">Output</div>
                        <div className="text-sm font-mono">{trace.output}</div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="text-xs text-white/40 mb-2">Execution Steps</div>
                    <div className="space-y-2">
                      {trace.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 bg-white/5 rounded-lg p-2"
                        >
                          <span className="text-xs text-white/40 w-6">{index + 1}</span>
                          {getStatusIcon(step.status)}
                          <span className="flex-1 text-sm">{step.name}</span>
                          {step.details && (
                            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                              {step.details}
                            </span>
                          )}
                          <span className="text-xs text-white/40">{step.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
