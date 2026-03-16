'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Info } from 'lucide-react'

interface LimitRow {
  key: string
  maxRequests: number
  windowMs: number
  windowSec: number
  description: string
}

interface UsageResponse {
  limits: LimitRow[]
  note: string
}

export default function SettingsApiPage() {
  const [data, setData] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/rate-limit/usage')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          API & rate limits
        </h1>
        <p className="text-muted-foreground mt-1">
          Configured rate limits for API endpoints. Current remaining and reset time are returned in response headers on each request.
        </p>
      </div>

      {loading && (
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load rate limit info: {error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <Card>
          <CardHeader>
            <CardTitle>Rate limits</CardTitle>
            <CardDescription>
              Per-minute (or per-window) limits by endpoint type. When you make a request, the response includes X-RateLimit-Remaining and X-RateLimit-Reset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-3 font-medium">Endpoint type</th>
                    <th className="text-left p-3 font-medium">Limit</th>
                    <th className="text-left p-3 font-medium">Window</th>
                  </tr>
                </thead>
                <tbody>
                  {data.limits.map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="p-3">
                        <span className="font-medium capitalize">{row.key}</span>
                        <p className="text-muted-foreground text-xs mt-0.5">{row.description}</p>
                      </td>
                      <td className="p-3">{row.maxRequests} requests</td>
                      <td className="p-3">{row.windowSec}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-sm">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{data.note}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              See <code className="text-xs bg-muted px-1 rounded">docs/api/RATE_LIMITS.md</code> for full details, or inspect response headers (X-RateLimit-*) on any rate-limited API call.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
