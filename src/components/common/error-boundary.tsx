import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">SeatSphere could not load this section.</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. Try reloading the page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-secondary p-4 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white"
            >
              Reload
            </button>
            <a
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
            >
              Go to Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
