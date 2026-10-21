import { Component, type ErrorInfo, type ReactNode } from 'react';

interface FeatureBoundaryProps {
  children: ReactNode;
  featureName: string;
  resetKey?: string;
}

interface FeatureBoundaryState {
  error: Error | null;
}

/**
 * Isolates optional workspace features so a failed renderer, chart, or lazy
 * module cannot make the entire design environment unavailable.
 */
export class FeatureBoundary extends Component<FeatureBoundaryProps, FeatureBoundaryState> {
  state: FeatureBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): FeatureBoundaryState {
    return { error };
  }

  componentDidUpdate(previousProps: FeatureBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.featureName} failed to render.`, error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section
        className="grid h-full min-h-48 place-items-center rounded-xl border border-rose-500/25 bg-rose-950/10 p-6 text-center"
        role="alert"
      >
        <div>
          <p className="text-sm font-semibold text-rose-200">{this.props.featureName} is unavailable.</p>
          <p className="mt-1 text-xs text-slate-400">The rest of the workspace is still available.</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Retry feature
          </button>
        </div>
      </section>
    );
  }
}
