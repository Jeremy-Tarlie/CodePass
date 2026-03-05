import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <div className="w-24 h-1 bg-red-600 mx-auto rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Oups ! Une erreur s'est produite</h1>
            <p className="text-gray-600 mb-6">
              Une erreur inattendue s'est produite dans l'application.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-sm text-red-600 font-mono break-words">{this.state.error.message}</p>
              </div>
            )}
            <div className="space-y-4">
              <button
                onClick={this.handleReload}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Recharger la page
              </button>
              <button
                onClick={this.handleReset}
                className="w-full bg-white text-red-600 py-3 px-6 rounded-lg border-2 border-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> Réessayer
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
