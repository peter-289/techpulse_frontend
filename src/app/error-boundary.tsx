import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../shared/ui/button/button';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[TechPulse] render failure', error, errorInfo.componentStack);
    }
  }

  private recover = () => {
    window.location.assign(window.location.href);
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <section className="w-full max-w-lg rounded-2xl border border-blue-600/10 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold">TechPulse could not load this view</h1>
          <p className="mt-2 text-sm text-slate-600">
            The error was recorded locally. Refresh the application to try again.
          </p>
          <Button className="mt-6" onClick={this.recover}>
            <RotateCcw size={15} /> Refresh application
          </Button>
        </section>
      </main>
    );
  }
}
