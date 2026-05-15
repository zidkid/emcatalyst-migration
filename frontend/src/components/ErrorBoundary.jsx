import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('React error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="bg-white rounded-xl shadow p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">Application Error</h2>
            <p className="text-gray-600 mb-4">Something went wrong. Please refresh the page and try again.</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto text-red-700">
              {this.state.error?.toString()}
            </pre>
            <button
              className="btn-primary"
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.href = '/login'
              }}
            >
              Clear session and go to login
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
