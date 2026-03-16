"use client"

import React, { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { reportError } from "@/lib/logging"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** Called when an error is caught (so parent can auto-fix) */
  onError?: (errorMessage: string) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class PreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, { boundary: "preview", componentStack: errorInfo?.componentStack?.slice(0, 500) })
    this.setState({
      error,
      errorInfo
    })
    this.props.onError?.(error.message)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center h-full bg-gray-900/50 p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Preview Error
              </h3>
              <p id="preview-error-boundary-message" className="text-sm text-gray-400 mb-4">
                {this.state.error?.message || "An error occurred while rendering the preview"}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-gray-500 bg-gray-950 p-3 rounded overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="gap-2"
                aria-describedby={this.state.error?.message && this.state.error.message.length > 100 ? "preview-error-boundary-message" : undefined}
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  this.handleReset()
                  window.location.href = "/builder"
                }}
              >
                Go to builder home
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              If this error persists, try regenerating the code or simplifying your request.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
