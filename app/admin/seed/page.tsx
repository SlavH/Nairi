"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to seed database')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Database Seeder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Click the button below to seed the database with sample data for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Feed posts (Nairi Flow)</li>
              <li>Courses (Nairi Learn)</li>
              <li>Agents (Marketplace)</li>
              <li>Marketplace creations (text, websites, templates, tools, courses)</li>
              <li>Knowledge nodes (Knowledge Graph)</li>
            </ul>

            <Button 
              onClick={handleSeed} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Seeding...' : 'Seed Database'}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-500/10 text-green-500 rounded-lg">
                <strong>Success!</strong>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
