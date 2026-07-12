import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center p-4 text-center">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-sm">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred while rendering this component.
              </p>
              {this.state.error && (
                <div className="mt-4 max-h-[200px] w-full overflow-auto rounded bg-muted p-4 text-left text-xs font-mono text-muted-foreground">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <Button onClick={this.handleReset} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
