"use client"

import React from 'react'
// import * as Sentry from '@sentry/nextjs' // Disabled - Sentry not compatible with Next.js 16
import { Button } from '@/components/ui/button'
import { reportError } from '@/lib/logging'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, {
      componentStack: errorInfo?.componentStack?.slice(0, 500),
      boundary: 'root',
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-4xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              Something unexpected happened. Try again or go to a safe page.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.reload()
                }}
                className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background"
              >
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.href = '/nav'
                }}
              >
                Open navigation
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.href = '/'
                }}
              >
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 overflow-auto rounded-md bg-muted p-4 text-xs">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
