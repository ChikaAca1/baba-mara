'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error logging service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // TODO: Send to error tracking service (Sentry, etc.)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Send error to logging service
      this.logErrorToService(error, errorInfo)
    }
  }

  async logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: error.name,
          error_message: error.message,
          stack_trace: error.stack,
          component_stack: errorInfo.componentStack,
          severity: 'high',
          endpoint: window.location.pathname,
        }),
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
                <summary className="cursor-pointer font-medium text-red-800 dark:text-red-400">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
