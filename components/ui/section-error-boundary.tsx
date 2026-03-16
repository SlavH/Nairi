"use client"

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface SectionErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  sectionName?: string
}

interface SectionErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Section-level error boundary for isolated component failures
 */
export class SectionErrorBoundary extends React.Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Section Error Boundary (${this.props.sectionName || 'Unknown'}) caught an error:`, error, errorInfo)
    
    // Log to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          section: this.props.sectionName || 'unknown',
        },
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                {this.props.sectionName ? `Error in ${this.props.sectionName}` : 'Section Error'}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                This section encountered an error and couldn't be displayed.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-3 break-all">
                  {this.state.error.message}
                </p>
              )}
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
